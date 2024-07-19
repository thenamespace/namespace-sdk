import {
  Account,
  Address,
  Hash,
  keccak256,
  toHex,
} from "viem";
import { BackendAPI, Mode } from "../env";
import {
  L2Chain,
  Listing,
  MainChain,
  MintRequest,
  MintTransactionParameters,
  SetRecordsRequest,
  SimulateMintResponse,
  SupportedChain,
} from "./types";
import { createApiActions, INamespaceApiActions } from "./api-actions";
import { createWeb3Actions, INamespaceWeb3Actions } from "./web3-actions";
import { getChain, getChainName } from "../web3";
import { mainnet } from "viem/chains";
import {
  AuthTokenMessage,
  AuthTokenRequest,
  AuthTokenResponse,
} from "./types/auth";

type SignTypedDataFunction = ({message}: {message: any}) => Hash | Promise<Hash> 

export interface INamespaceClient {
  getListedName(ensName: string, chainId?: number): Promise<Listing>;
  getMintDetails(
    listing: Listing,
    subnameLabel: string,
    minterAddress: Address
  ):Promise<SimulateMintResponse>;
  getMintTransactionParameters(
    listing: Listing,
    mintRequest: MintRequest
  ): Promise<MintTransactionParameters> 
  isSubnameAvailable(listing: Listing, subnameLabel: string): Promise<boolean>;
  generateAuthToken(principal: Address, signingFunction: SignTypedDataFunction, signingMessage?: string): Promise<AuthTokenResponse>;
}

export interface NamespaceClientProperties {
  chainId: number;
  mode?: Mode;
  rpcUrl?: string;
  walletAccount?: Account;
  mintSource?: string;
}

class NamespaceClient implements INamespaceClient {
  private apiActions: INamespaceApiActions;
  private web3Actions: INamespaceWeb3Actions;

  constructor(private readonly opts: NamespaceClientProperties) {
    const backendApi = BackendAPI[opts.mode || "production"];
    this.apiActions = createApiActions(backendApi);
    this.web3Actions = this.setupWeb3Actions();
  }
 
  public async generateAuthToken(
    principal: Address,
    signTypedDataFunction: SignTypedDataFunction,
    signingMessage?: string,
  ): Promise<AuthTokenResponse> {
    const message: AuthTokenMessage = {
      app: this.opts.mintSource || "namespace-sdk",
      issued: new Date().getTime(),
      message: signingMessage || "Please Sign In",
      nonce: this.randomNonce(),
      principal,
    };

    const signature = await signTypedDataFunction(message);

    const request: AuthTokenRequest = {
      message: message,
      signature,
    };

    return this.apiActions.getAuthToken(request);
  }

  public async isSubnameAvailable(listing: Listing, subnameLabel: string) {
    this.ensureValidChainForListing(listing);

    const fullSubname = `${subnameLabel}.${listing.fullName}`;
    const chainId = this.getRequiredChainForListing(listing);

    if (listing.listingType === "l2") {
      return this.web3Actions.isL2SubnameAvailable(fullSubname, chainId);
    }

    return this.web3Actions.isL1SubnameAvailable(fullSubname, chainId);
  }

  public async getMintDetails(
    listing: Listing,
    subnameLabel: string,
    minterAddress: Address
  ): Promise<SimulateMintResponse> {
    return this.apiActions.simulateMintParametersRequest({
      label: subnameLabel,
      minter: minterAddress,
      network: listing.network,
      parentLabel: listing.label,
      subnameOwner: minterAddress,
    });
  }

  public async getListedName(
    ensName: string,
    chainId: number = mainnet.id
  ): Promise<Listing> {
    const chainName = getChainName(chainId);
    return this.apiActions.getListedName(ensName, chainName as MainChain);
  }

  public async getMintTransactionParameters(
    listing: Listing,
    mintRequest: MintRequest
  ): Promise<MintTransactionParameters> {
  
    this.ensureValidChainForListing(listing);
    if (listing.listingType === "l2") {
      return this.l2MintParameters(listing, mintRequest);
    }
    return this.l1MintParameters(listing, mintRequest);
  }

  private async l1MintParameters(
    listing: Listing,
    mintRequest: MintRequest
  ): Promise<MintTransactionParameters> {
    const subnameOwner = mintRequest.subnameOwner || mintRequest.minterAddress;
    const params = await this.apiActions.getMintingL1Parameters(
      {
        label: mintRequest.subnameLabel,
        network: listing.network,
        subnameOwner: subnameOwner,
        parentLabel: listing.label,
      },
      mintRequest.minterAddress,
      mintRequest.token
    );

    let mintRecords: SetRecordsRequest | undefined;
    if (mintRequest.records) {
      mintRecords = {
        addresses: mintRequest.records.addresses || [],
        texts: mintRequest.records.texts || [],
        contenthash: mintRequest.records.contenthash,
        fullSubname: `${mintRequest.subnameLabel}.${listing.fullName}`,
      };
    }

    return this.web3Actions.getL1MintTransactionParams(params, listing.network, mintRecords);
  }

  private async l2MintParameters(
    listing: Listing,
    mintRequest: MintRequest
  ): Promise<MintTransactionParameters> {
    const subnameOwner = mintRequest.subnameOwner || mintRequest.minterAddress;
    const params = await this.apiActions.getMintingL2Parameters(
      {
        label: mintRequest.subnameLabel,
        mainNetwork: listing.network,
        owner: subnameOwner,
        parentLabel: listing.label,
        tokenNetwork: listing.tokenNetwork as L2Chain,
      },
      mintRequest.minterAddress,
      mintRequest.token
    );

    let mintRecords: SetRecordsRequest | undefined;
    if (mintRequest.records) {
      mintRecords = {
        addresses: mintRequest.records.addresses || [],
        texts: mintRequest.records.texts || [],
        contenthash: mintRequest.records.contenthash,
        fullSubname: `${mintRequest.subnameLabel}.${listing.fullName}`,
      };
    }

    return this.web3Actions.getL2MintTransactionParams(
      params,
      listing.tokenNetwork as L2Chain,
      mintRecords
    );
  }

  private ensureValidChainForListing(listing: Listing) {
    const requiredChainId = this.getRequiredChainForListing(listing);
    if (this.opts.chainId !== requiredChainId) {
      throw new Error(
        `Invalid chainId for listing ${listing.fullName}. Required: ${requiredChainId}, Current: ${this.opts.chainId}`
      );
    }
  }

  private getRequiredChainForListing = (listing: Listing): number => {
    let requiredChainName: SupportedChain = listing.network;
    if (listing.listingType === "l2") {
      requiredChainName = listing.tokenNetwork as SupportedChain;
    }
    const requiredChain = getChain(requiredChainName);
    return requiredChain.id;
  };

  private setupWeb3Actions() {
    const { walletAccount, rpcUrl, chainId, mintSource } = this.opts;
    const chainName = getChainName(chainId);
    const chain = getChain(chainName);

    return createWeb3Actions({
      chain,
      mintSource,
      rpcUrl,
      walletAccount,
    });
  }

  private randomNonce = () => {
    const baseRandomNumber = Math.floor(Math.random() * 100000);
    return keccak256(toHex(baseRandomNumber));
  };
}

export const createNamespaceClient = (
  opts: NamespaceClientProperties
): INamespaceClient => {
  return new NamespaceClient(opts);
};
