import { Address, zeroAddress } from "viem";
import { L2Chain, MainChain } from "../clients";


interface NamespaceL2ContractsLegacy {
  controller: Address;
  factory: Address;
  manager: Address;
  resolver: Address;
}

interface NamespaceL2Contracts {
  controller: Address;
  resolver: Address;
  registryResolver: Address;
  emitter: Address;
  controllerV2: Address;
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

const OffchainResolvers: Record<L2Chain, Address> = {
  arbitrum: zeroAddress,
  optimism: zeroAddress,
  base: "0xaE04a09CF2c408803AC7718e3dE22ac346a05B58",
  baseSepolia: "0xdf244e628c49cd61a612ce2c84516722b2051fed",
};

const L2ChainAddresses: Record<L2Chain, NamespaceL2Contracts> = {
  base: {
    controller: "0xa8e61891626f86ae6397217823701183de947c7d",
    emitter: "0xA9EA3fbBDB2d1696dC67C5FA45D9A64Ac432888C",
    registryResolver: "0x0D8e2772B4D8d58C8a66EEc5bf77c07934b84942",
    resolver: "0x32d63B83BBA5a25f1f8aE308d7fd1F3c0b1abfA6",
    controllerV2: "0xa8e61891626f86ae6397217823701183de947c7d",
  },
  // currently, L2 subnames are only supported for Base chain
  optimism: {
    controller: "0x5C1220C4C5D75aC2d0A2f893995b5eCec98F3Aa6",
    resolver: "0xD8de4F5D7117BA37bA171ec9180Da798056f2CEd",
    emitter: "0x87516B5518a6548433AB97aE59b15B1A31472F11",
    registryResolver: "0x0798278Ff2c8aD096447B5C368Ce682118D87f63",
    controllerV2: "0x5C1220C4C5D75aC2d0A2f893995b5eCec98F3Aa6",
  },
  arbitrum: {
    controller: zeroAddress,
    resolver: zeroAddress,
    emitter: zeroAddress,
    registryResolver: zeroAddress,
    controllerV2: zeroAddress,
  },
  baseSepolia: {
    controller: "0x316427abA8fBb45B086F5C1Fcc243F09353C97D9",
    resolver: "0x0a31201dc15E25062E4Be297a86F5AD8DccC8055",
    emitter: "0x8764EFC3d0b1172a3B76143b0A0E6757525Afc1f",
    registryResolver: "0x8810B0A0946E1585Cb4ca0bB07fDC074d7038941",
    controllerV2: "0xD01626e0872aE04393B69D7Bb34bAea9abC48102",
  },
};

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
  baseSepolia: {
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

export const getL2ChainContractsLegacy = (chainName: L2Chain) => {
  return L2ChainAddressesLegacy[chainName];
};

export const getEnsContracts = (chainName: MainChain) => {
  return EnsContracts[chainName];
};

export const getOffchainResolverForL2Network = (chainName: L2Chain) => {
  return OffchainResolvers[chainName];
};
