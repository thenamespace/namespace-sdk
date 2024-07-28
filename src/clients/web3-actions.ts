import {
  Account,
  Address,
  Chain,
  createPublicClient,
  encodeFunctionData,
  Hash,
  http,
  namehash,
  parseAbi,
  PublicClient,
  toHex,
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
  MintTransactionParameters,
  SetRecordsRequest,
} from "./types/minting";
import L2_CONTROLLER_ABI from "../web3/abi/l2-controller-abi.json";
import L1_MINT_CONTROLLER from "../web3/abi/l1-mint-controller-abi.json";

export interface INamespaceWeb3Actions {
  getL2MintTransactionParams(
    params: L2MintParamsResponse,
    l2Chain: L2Chain,
    records?: SetRecordsRequest
  ): Promise<MintTransactionParameters>;
  getL1MintTransactionParams(
    params: L1MintParamsResponse,
    mainChain: MainChain,
    records?: SetRecordsRequest
  ): Promise<MintTransactionParameters>;
  
  isL1SubnameAvailable(fullName: string, chainId: number): Promise<boolean>;
  isL2SubnameAvailable(fullName: string, chainId: number): Promise<boolean>;
}

interface CreateWeb3ActionOpts {
  chain: Chain,
  walletAccount?: Account,
  rpcUrl?: string,
  mintSource?: string
}

class Web3Actions implements INamespaceWeb3Actions {
  
  private publicClient: any
  
  constructor(
    private readonly chain: Chain,
    private readonly rpcUrl?: string,
    private readonly mintSource?: string
  ) {
    this.publicClient = createPublicClient({
      transport: http(this.rpcUrl),
      chain: this.chain
    })
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
    if (splittedValue.length < 3) {
      throw new Error("Invalid subname:" + fullName);
    }

    const valueLen = splittedValue.length;
    const parentName = `${splittedValue[valueLen - 2]}.${splittedValue[valueLen - 1]}`
    const parentNode = namehash(parentName);
    const subnameNode = namehash(fullName);

    return await this.publicClient.readContract({
      abi: parseAbi([
        "function subnodeOwner(bytes32 node, bytes32 parentNode) external view returns (address)",
      ]),
      address: l2Contracts.registryResolver,
      functionName: "subnameOwner",
      args: [subnameNode, parentNode],
    }) === zeroAddress;
  }

  public async getL2MintTransactionParams(
    params: L2MintParamsResponse,
    l2Chain: L2Chain,
    records?: SetRecordsRequest
  ): Promise<MintTransactionParameters> {

    const { controller } = getL2ChainContracts(l2Chain);
    const { parameters: mintParameters } = params;

    let resolverData: Hash[] = [];
    if (records) {
      resolverData = this.convertRecordsToResolverData(records);
    }

    const totalPrice =
      BigInt(mintParameters.fee) + BigInt(mintParameters.price);
    const { request } = await this.publicClient.simulateContract({

      //@ts-ignore
      abi: L2_CONTROLLER_ABI,
      address: controller,
      functionName: "mint",
      args: [
        params.parameters,
        params.signature,
        resolverData,
        toHex(this.getMintSource()),
      ],
      value: totalPrice,
    });

    const txParams: MintTransactionParameters = {
      abi: request.abi,
      functionName: request.functionName,
      args: request.args,
      contractAddress: request.address,
      value: request.value,
      chain: this.chain
    }
    
    return txParams;
  }

  public async getL1MintTransactionParams(
    params: L1MintParamsResponse,
    mainChain: MainChain,
    records?: SetRecordsRequest
  ): Promise<MintTransactionParameters> {

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

    return {
      abi: mintRequest.abi,
      functionName: mintRequest.functionName,
      args: mintRequest.args,
      contractAddress: mintRequest.address,
      value: mintRequest.value,
      chain: this.chain
    }
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

  private getPublicClient = (): PublicClient => {
    return this.publicClient;
  }

}

export function createWeb3Actions(opts: CreateWeb3ActionOpts): INamespaceWeb3Actions {
  return new Web3Actions(opts.chain, opts.rpcUrl, opts.mintSource);
}
