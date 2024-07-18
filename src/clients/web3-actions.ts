import {
  Account,
  Address,
  Chain,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  Hash,
  http,
  namehash,
  parseAbi,
  PublicClient,
  toHex,
  WalletClient,
  zeroAddress,
} from "viem";
import {
  getChainName,
  getEnsContracts,
  getL2ChainContracts,
  getMainChainContracts,
} from "../web3";
import { L2Chain, MainChain } from "./types";
import {
  L1MintParamsResponse,
  L2MintParamsResponse,
  SetRecordsRequest,
} from "./types/minting";
import * as L2_CONTROLLER_ABI from "../web3/abi/l2-controller-abi.json";
import * as L1_MINT_CONTROLLER from "../web3/abi/l1-mint-controller-abi.json";
import { AuthTokenMessage, AuthTypedData } from "./types/auth";

export interface INamespaceWeb3Actions {
  mintL2Subname(
    params: L2MintParamsResponse,
    l2Chain: L2Chain,
    records?: SetRecordsRequest
  ): Promise<Hash>;
  mintL1Subname(
    params: L1MintParamsResponse,
    mainChain: MainChain,
    records?: SetRecordsRequest
  ): Promise<Hash>;
  isL1SubnameAvailable(fullName: string, chainId: number): Promise<boolean>;
  isL2SubnameAvailable(fullName: string, chainId: number): Promise<boolean>;
  signAuthMessage(message: AuthTokenMessage): Promise<Hash> ;
}

interface CreateWeb3ActionOpts {
  chain: Chain,
  walletAccount?: Account,
  rpcUrl?: string,
  mintSource?: string
}

class Web3Actions implements INamespaceWeb3Actions {
  
  private publicClient: any
  private walletClient: any
  
  constructor(
    private readonly chain: Chain,
    private readonly walletAccount?: Account,
    private readonly rpcUrl?: string,
    private readonly mintSource?: string
  ) {
    this.publicClient = createPublicClient({
      transport: http(this.rpcUrl),
      chain: this.chain
    })

    if (this.walletAccount) {
      this.walletClient = createWalletClient({
        transport: http(this.rpcUrl),
        account: walletAccount,
        chain: this.chain
      })
    }

  }

  public async isL1SubnameAvailable(
    fullName: string,
    chainId: number
  ): Promise<boolean> {

    const chainName = getChainName(chainId);
    if (!chainName) {
      throw new Error("Unsupported chainId: " + chainId);
    }
    const ensContracts = getEnsContracts(chainName as MainChain);
    if (!ensContracts) {
      throw new Error(
        "L1 subname availability not supported for chain: " + chainId
      );
    }

    const currentOwner = await this.getPublicClient().readContract({
      abi: parseAbi(["function owner(bytes32 node) external returns(address)"]),
      functionName: "owner",
      args: [namehash(fullName)],
      address: ensContracts.registry
    });
    return currentOwner === zeroAddress;
  }

  public async isL2SubnameAvailable(
    fullName: string,
    chainId: number
  ): Promise<boolean> {
     
    const chainName = getChainName(chainId);

    if (!chainName) {
      throw new Error("Unsupported chainId: " + chainId);
    }

    const l2Contracts = getL2ChainContracts(chainName as L2Chain);

    if (!l2Contracts) {
      throw new Error(
        "L2 subname availability not supported for chain: " + chainId
      );
    }

    const splittedValue = fullName.split(".");

    if (splittedValue.length !== 3) {
      throw new Error("");
    }

    const label = splittedValue[0];
    const parentName = `${splittedValue[1]}.${splittedValue[2]}`;

    return await this.publicClient.readContract({
      abi: parseAbi([
        "function isNodeAvailable(string label, bytes32 node) external view returns (bool)",
      ]),
      address: l2Contracts.controller,
      functionName: "isNodeAvailable",
      args: [label, namehash(parentName)],
    });
  }

  public async mintL2Subname(
    params: L2MintParamsResponse,
    l2Chain: L2Chain,
    records?: SetRecordsRequest
  ) {

    if (this.isReadOnly()) {
      throw Error("Wallet account not connected, cannot perform write operation.")
    }

    const { controller } = getL2ChainContracts(l2Chain);
    const { parameters: mintParameters } = params;

    let resolverData: Hash[] = [];
    if (records) {
      resolverData = this.convertRecordsToResolverData(records);
    }

    const totalPrice =
      BigInt(mintParameters.fee) + BigInt(mintParameters.price);
    const { request } = await this.publicClient.simulateContract({
      abi: L2_CONTROLLER_ABI,
      address: controller,
      functionName: "mint",
      args: [
        { ...params.parameters, resolverData },
        params.signature,
        toHex(this.getMintSource()),
      ],
      value: totalPrice,
    });

    return this.getWalletClient().writeContract(request);
  }

  public async mintL1Subname(
    params: L1MintParamsResponse,
    mainChain: MainChain,
    records?: SetRecordsRequest
  ): Promise<Hash> {

    if (this.isReadOnly()) {
      throw Error("Wallet account not connected, cannot perform write operation.")
    }

    const { mintController } = getMainChainContracts(mainChain);
    const { parameters: mintParameters, signature } = params;

    let resolverData: Hash[] = [];
    if (records) {
      resolverData = this.convertRecordsToResolverData(records);
    }

    let mintRequest: any;
    const totalPrice = BigInt(mintParameters.mintFee) + BigInt(mintParameters.mintPrice);

    if (resolverData.length === 0) {
      const { request } = await this.publicClient.simulateContract({
        abi: L1_MINT_CONTROLLER,
        address: mintController,
        functionName: "mint",
        args: [mintParameters, signature],
        value: totalPrice,
      })
      mintRequest = request;
    } else {
      const { request } = await this.publicClient.simulateContract({
        abi: L1_MINT_CONTROLLER,
        address: mintController,
        functionName: "mintWithData",
        args: [mintParameters, signature, resolverData],
        value: totalPrice,
      })
      mintRequest = request;
    }
    return this.getWalletClient().writeContract(mintRequest);
  }

  public async signAuthMessage(message: AuthTokenMessage): Promise<Hash> {

    if (this.isReadOnly()) {
      throw Error("Wallet account required for generating token")
    }

    const signature = await this.getWalletClient().signTypedData({
      //@ts-ignore
      message: message,
      types: AuthTypedData.Types,
      domain: AuthTypedData.Domain,
      primaryType: "SignIn"
    })
    return signature;
  }

  private getMintSource() {
    return this.mintSource || "namespace-sdk";
  }

  private convertRecordsToResolverData(records: SetRecordsRequest): Hash[] {
    const data: Hash[] = [];

    const { texts, addresses, contenthash, fullSubname } = records;
    const subnameNode = namehash(fullSubname);

    texts.forEach((txt) => {
      const encodedTextFunction = encodeFunctionData({
        abi: parseAbi([
          "function setText(bytes32 node, string key, string value) external",
        ]),
        args: [subnameNode, txt.key, txt.value],
        functionName: "setText",
      });
      data.push(encodedTextFunction);
    });

    addresses.forEach((addr) => {
      if (addr.coinType === 60) {
        const encodedAddrFunction = encodeFunctionData({
          abi: parseAbi(["function setAddr(bytes32 node, address a)"]),
          functionName: "setAddr",
          args: [subnameNode, addr.address as Address],
        });
        data.push(encodedAddrFunction);
      } else {
        const encodedAddrFunction = encodeFunctionData({
          abi: parseAbi([
            "function setAddress(bytes32 node, uint256 coinType, bytes newAddress)",
          ]),
          functionName: "setAddress",
          args: [subnameNode, BigInt(addr.coinType), addr.address as Hash],
        });
        data.push(encodedAddrFunction);
      }
    });

    if (contenthash && contenthash.length > 0) {
      const contenthashFunc = encodeFunctionData({
        abi: parseAbi([
          "function setContenthash(bytes32 node, bytes contenthash) external",
        ]),
        functionName: "setContenthash",
        args: [subnameNode, contenthash as Hash],
      });
      data.push(contenthashFunc);
    }
    return data;
  }

  private isReadOnly = () => {
    return !this.walletClient
  }

  private getPublicClient = (): PublicClient => {
    return this.publicClient;
  }

  private getWalletClient = (): WalletClient => {
    return this.walletClient;
  }
}


export function createWeb3Actions(opts: CreateWeb3ActionOpts): INamespaceWeb3Actions {
  return new Web3Actions(opts.chain, opts.walletAccount, opts.rpcUrl, opts.mintSource);
}
