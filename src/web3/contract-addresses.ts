import { Address, zeroAddress } from "viem";
import { L2Chain, MainChain } from "../clients";

interface NamespaceL2Contracts {
  controller: Address;
  factory: Address;
  manager: Address;
  resolver: Address;
}

interface NamespaceL1Contracts {
  mintController: Address;
  listController: Address;
}

interface EnsContracts {
  wrapper: Address;
  registry: Address;
}

const MainChainAddresses: Record<MainChain, NamespaceL1Contracts> = {
  mainnet: {
    listController: "0xD75707Df440Aae28BbF243855Fcb4D62c366EfD6",
    mintController: "0x18cC184E630A8290e46082351ba66A209a0787ba",
  },
  sepolia: {
    listController: "0x0a46b7Da09A30f1bAB117dD97f73c3e83aa2C2db",
    mintController: "0x2674E4FAe872780F01B99e109E67749B765703fB",
  },
};

const L2ChainAddresses: Record<L2Chain, NamespaceL2Contracts> = {
  base: {
    controller: "0x38dB2bA2Fc5A6aD13BA931377F938BBDe831D397",
    factory: "0x994E494506FE8166f2434E52560755D790eF5641",
    manager: "0x903Ece28831a1c08D5e50D85626BFC72431930C4",
    resolver: "0x0aBD0a6A1A98D7BD5D9909A3F1d7EE0B74587d70",
  },
  // currently, L2 subnames are only supported for Base chain
  optimism: {
    controller: zeroAddress,
    factory: zeroAddress,
    manager: zeroAddress,
    resolver: zeroAddress,
  },
  arbitrum: {
    controller: zeroAddress,
    factory: zeroAddress,
    manager: zeroAddress,
    resolver: zeroAddress,
  },
};

export const EnsContracts: Record<MainChain, EnsContracts> = {
  mainnet: {
    wrapper: "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401",
    registry: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
  },
  sepolia: {
    wrapper: "0x0635513f179D50A207757E05759CbD106d7dFcE8",
    registry: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
  },
};

export const getMainChainContracts = (chainName: MainChain) => {
  return MainChainAddresses[chainName];
};

export const getL2ChainContracts = (chainName: L2Chain) => {
  return L2ChainAddresses[chainName];
};

export const getEnsContracts = (chainName: MainChain) => {
  return EnsContracts[chainName];
};
