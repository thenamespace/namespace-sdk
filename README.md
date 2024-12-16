![Namespace Ninja](https://namespace.fra1.cdn.digitaloceanspaces.com/brand/logo_small.png)
# Namespace-SDK

A TypeScript SDK for interacting with Namespace - a platform for managing ENS names and subnames. Built on top of [Viem](https://viem.sh), this SDK enables you to:
* List and manage ENS subnames
* Check subname availability across multiple chains
* Mint ENS subnames with custom records
* Interact with Namespace smart contracts

> **Note**: This project is in early stages and is under active development.

# Installation

Install using your preferred package manager:

```bash
# pnpm
pnpm add namespace-sdk

# npm
npm install namespace-sdk

# yarn
yarn add namespace-sdk
```
**Note**: We recommend using [pnpm](https://pnpm.io/) due to its better performance and smaller bundle size.

# Usage

## Prerequisites

### Listing an ENS Name

Before minting subnames, you need to list your ENS name on the [Namespace platform](https://app.namespace.tech).

You can find the required steps by following the [Manager Guide](https://docs.namespace.tech/namespace-platform/manager/listing-an-ens-name#listing-an-ens-name)

## Using the SDK

### Initialize the Client

Create a NamespaceClient instance by specifying the chain you want to interact with.

```typescript
import { createNamespaceClient } from "namespace-sdk";
import { sepolia } from "viem/chains";

// Initialize the Namespace SDK client
const namespaceClient = createNamespaceClient({
  chainId: sepolia.id
});
```

Currently, we support the following chains:
- Ethereum Mainnet 
- Sepolia Testnet 
- Base 
- Base Sepolia Testnet 
- Optimism 
- Arbitrum 

**Note**: We are actively working on adding support for more chains.

### Minting ENS Subnames

The minting process consists of two main steps:
1. Check subname availability and generate the required transaction parameters:
```typescript
// Import the Namespace SDK and Viem chains
import { createNamespaceClient, MintTransactionParameters } from "namespace-sdk";
import { sepolia } from "viem/chains";

// Initialize the Namespace SDK client
const namespaceClient = createNamespaceClient({
  chainId: sepolia.id,
});

// Define the listed name from the [Namespace Platform](https://docs.namespace.tech/namespace-platform/manager/listing-an-ens-name#listing-an-ens-name) in the previous step
const LISTED_NAME = "namespace-sdk.eth"

// Define the subname to be minted
const SUBNAME_LABEL = "subname"

// Define the minter address
const MINTER_ADDRESS = "0xbe02d5ceAB7296A4E8b516eee578Be75983674e9"

const generateMintingParameters = async (): Promise<MintTransactionParameters> => {

  // Get listed name from namespace api
  const listedName = await namespaceClient.getListedName(
    LISTED_NAME,
    sepolia.id
  );

  // Check for name availability
  const isNotTaken = await namespaceClient.isSubnameAvailable(
    listedName,
    SUBNAME_LABEL
  );

  if (!isNotTaken) {
    throw Error("Subname is already taken!");
  }

   // Generate mint transcation parameters
  const mintDetails = await namespaceClient.getMintTransactionParameters(listedName, {
    minterAddress: MINTER_ADDRESS,
    subnameLabel: SUBNAME_LABEL,
    subnameOwner: MINTER_ADDRESS,
  });
  return mintDetails;
};
```

2. Execute the Mint Transaction

Use Viem's WalletClient to send the transaction:

```typescript
// Import your wallet and create a Viem Wallet Client
const wallet = privateKeyToAccount("0xYOUR_PRIVATE_KEY_HERE");
const walletClient = createWalletClient({
  transport: http(),
  chain: sepolia,
  account: wallet,
})

// Generate minting parameters
const mintParams = await generateMintingParameters();

// Send transaction
const transactionHash = await walletClient.writeContract({
  abi: mintParams.abi,
  address: mintParams.contractAddress,
  functionName: mintParams.functionName,
  args: mintParams.args,
  value: mintParams.value,
})

console.log(transactionHash);
```

Full example:
```typescript
// Import the Namespace SDK and Viem chains
import { createNamespaceClient, MintTransactionParameters } from "namespace-sdk";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";

// Initialize the Namespace SDK client
const namespaceClient = createNamespaceClient({
  chainId: sepolia.id,
});

// Define the listed name from the [Namespace Platform](https://docs.namespace.tech/namespace-platform/manager/listing-an-ens-name#listing-an-ens-name) in the previous step
const LISTED_NAME = "namespace-sdk.eth"

// Define the subname to be minted
const SUBNAME_LABEL = "subname"

// Define the minter address
const MINTER_ADDRESS = "0xbe02d5ceAB7296A4E8b516eee578Be75983674e9"

const generateMintingParameters = async (): Promise<MintTransactionParameters> => {

  // Get listed name from namespace api
  const listedName = await namespaceClient.getListedName(
    LISTED_NAME,
    sepolia.id
  );

  // Check for name availability
  const isNotTaken = await namespaceClient.isSubnameAvailable(
    listedName,
    SUBNAME_LABEL
  );

  if (!isNotTaken) {
    throw Error("Subname is already taken!");
  }

   // Generate mint transcation parameters
  const mintDetails = await namespaceClient.getMintTransactionParameters(listedName, {
    minterAddress: MINTER_ADDRESS,
    subnameLabel: SUBNAME_LABEL,
    subnameOwner: MINTER_ADDRESS,
  });
  return mintDetails;
};

// Import your wallet and create a Viem Wallet Client
const wallet = privateKeyToAccount("0xYOUR_PRIVATE_KEY_HERE");
const walletClient = createWalletClient({
  transport: http(),
  chain: sepolia,
  account: wallet,
})

// Generate minting parameters
const mintParams = await generateMintingParameters();

// Send transaction
const transactionHash = await walletClient.writeContract({
  abi: mintParams.abi,
  address: mintParams.contractAddress,
  functionName: mintParams.functionName,
  args: mintParams.args,
  value: mintParams.value,
})

console.log(transactionHash);
```
**Note**: We recommend setting a custom RPC URL for the chain you are interacting with. You can do so by adding an argument to the http() function:
```typescript
const walletClient = createWalletClient({
  transport: http('https://eth-sepolia.g.alchemy.com/v2/ALCHEMY_API_KEY'),
  chain: sepolia,
  account: wallet,
})
```


## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting PRs.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Authors
- [artii.eth](https://github.com/nenadmitt)
