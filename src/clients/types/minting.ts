import { Abi, Address, Chain, Hash } from "viem";
import { L2Chain, MainChain } from "./web3";

export interface L1MintParamsRequest {
    label: string;
    parentLabel: string;
    subnameOwner: string;
    resolver?: string;
    network: MainChain;
    registrationPeriod?: number;
}

export interface L1MintParameters {
    subnameLabel: string;
    parentNode: string;
    resolver: string;
    subnameOwner: string;
    fuses: number;
    mintPrice: string;
    mintFee: string;
    expiry: number;
    ttl: number;
}

export interface L1MintParamsResponse {
  parameters: L1MintParameters;
  signature: Hash;
}

export interface L2MintParamsRequest {
  mainNetwork: MainChain;
  registryNetwork: L2Chain;
  parentNode: string;
  label: string;
  owner: string;
  expiryInYears?: number;
  parentLabel: string
  useV2?: boolean
  minterAddress?: Address
}

export interface L2MintParameters {
  label: string;
  parentNode: string;
  owner: string;
  expiry: number;
  price: string;
  fee: string;
  paymentReceiver: Address;
  nonce: string;
  verifiedMinter?: Address
  signatureExpiry?: string
}

export interface L2MintParamsResponse {
  parameters: L2MintParameters;
  signature: Hash;
}

export interface SimulateMintRequest {
  label: string;
  parentLabel: string;
  network: MainChain;
  minter: Address;
  subnameOwner: Address;
}

export interface SimulateMintResponse {
  canMint: boolean;
  estimatedPrice: number;
  estimatedFee: number;
  validationErrors: MintDeniedReason[];
  requiresVerifiedMinter: boolean;
  isStandardFee: boolean;
}

export type MintDeniedReason =
  | "SUBNAME_TAKEN"
  | "MINTER_NOT_TOKEN_OWNER"
  | "MINTER_NOT_WHITELISTED"
  | "LISTING_EXPIRED"
  | "SUBNAME_RESERVED"
  | "VERIFIED_MINTER_ADDRESS_REQUIRED"
  | "UNKNOWN_REASON";

export interface SetRecordsRequest {
    fullSubname: string
    addresses: AddressRecord[];
    texts: TextRecord[];
    contenthash?: string;
}  

export interface MintRequest {
  subnameLabel: string;
  subnameOwner?: Address;
  minterAddress: Address;
  expiryInYears?: number
  token?: string;
  records?: {
    addresses: AddressRecord[]
    texts: TextRecord[]
    contenthash?: string
  }
}

export interface TextRecord {
  key: string;
  value: string;
}

export interface AddressRecord {
  address: string;
  coinType: number;
}

export interface MintTransactionParameters {
  abi: Abi,
  contractAddress: Address
  functionName: string
  args: any
  value: bigint
  chain: Chain
}
