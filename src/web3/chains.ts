import { Chain } from "viem";
import { SupportedChain } from "../clients";
import { mainnet, base, sepolia, optimism, arbitrum } from "viem/chains";

export const SupportedChains: Record<SupportedChain, Chain> = {
    arbitrum,
    optimism: optimism as Chain,
    base: base as Chain,
    mainnet,
    sepolia
}

export const getChainName = (chainId: number): SupportedChain => {
    for (const chainName of Object.keys(SupportedChains)) {
        const _chainName = chainName as SupportedChain;
        if (SupportedChains[_chainName].id === chainId) {
            return _chainName;
        }
    }
    throw new Error("Unsupported chain: " + chainId)
}

export const getChain = (chainName: SupportedChain) => {
    return SupportedChains[chainName];
}