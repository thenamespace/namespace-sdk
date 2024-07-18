import { L2Chain, MainChain } from "."
import { Address } from "viem"

export interface ListingRequest {
    listingType?: ListingType
    network: MainChain
    tokenNetwork?: L2Chain
    owner?: Address
    page?: number
    size?: number
}

export interface Listing {
    label: string;
    fullName: string;
    node: string;
    network: MainChain;
    listingType?: ListingType
    tokenNetwork?: L2Chain 
}


export type ListingType = "sellUnruggable" | "l2"