import { Address, zeroAddress } from "viem";
import { L2Chain, MainChain } from "../clients";

export const isLegacyName = (name: string) => {
  // we have a couple of names that have remained on old contracts
  // this is a workaround until we migrate 
  const legacy = ["gotbased.eth","musicaw3.eth"];

  const split = name.split(".");
  if (split.length === 2) {
    return legacy.includes(name);
  }

  if (split.length === 3) {
    const parent = `${split[1]}.${split[2]}`;
    return legacy.includes(parent);
  }

  return false;

}

interface NamespaceL2ContractsLegacy {
  controller: Address;
  factory: Address;
  manager: Address;
  resolver: Address;
}

interface NamespaceL2Contracts {
  controller: Address;
  resolver: Address;
  registryResolver: Address
  emitter: Address
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

const L2ChainAddresses: Record<L2Chain, NamespaceL2Contracts>  = {
  base: {
    controller: "0x27b792d933A905c9BB53b139898d0d79654BE2Ab",
    resolver: "0xA1f1eE95B22bBfFd5cB72f70573B8c3A762a4Ed8",
    emitter: "0xd7836B047dD66622b7AAB743E88Dd158dDc23Dc1",
    registryResolver: "0xBB49Cd94f5cd37bbf19aD9eab5024426A56674e7"
  },
  // currently, L2 subnames are only supported for Base chain
  optimism: {
    controller: zeroAddress,
    resolver: zeroAddress,
    emitter: zeroAddress,
    registryResolver: zeroAddress
  },
  arbitrum: {
    controller: zeroAddress,
    resolver: zeroAddress,
    emitter: zeroAddress,
    registryResolver: zeroAddress
  },
}

const L2ChainAddressesLegacy: Record<L2Chain, NamespaceL2ContractsLegacy> = {
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
}

export const getL2ChainContractsLegacy = (chainName: L2Chain) => {
  return L2ChainAddressesLegacy[chainName];
};

export const getEnsContracts = (chainName: MainChain) => {
  return EnsContracts[chainName];
};
