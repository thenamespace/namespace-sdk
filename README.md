![Namespace Ninja](https://namespace.fra1.cdn.digitaloceanspaces.com/brand/logo_small.png)
# Namespace-SDK

A Typescript library used to interact with Namespace contracts and apis. 
It uses Viem under the hood and can be used to:
* Find names listed on Namespace platform
* Check the availability of subnames
* Mint subnames

This is the initial version, expect many more functionalities in the future!

# Installation

Use a package manager to install library into your project

Yarn
```bash
yarn add namespace-sdk
```
Npm
```bash
npm install namespace-sdk
```

# Getting started

First we can create a simple NamespaceClient and specify the chainId. The chain id specifies a chain on which read/write blockchain operations happen. If we list our name on a Mainnet and subnames are minted on Mainnet, we'll have to specify a chainId 1. We will use a sepolia testnet in the example.

The chainId is required since the library supports minting subnames on both Layer 1 and its testnet (Sepolia) but also on the Layer 2 ( Currently, only Base chain is supported )

```typescript
import { createNamespaceClient } from "namespace-sdk";
import { sepolia } from "viem/chains";

const namespaceClient = createNamespaceClient({
  chainId: sepolia.id
});
```
# Minting a subname

Minting ENS subnames requires a couple of steps. 

## 1. Listing an ENS name

First, we would need to have an ENS name which is listed on Namespace platform. To do so, visit our [Platform](https://app.namespace.tech) and check 
[Manager](https://docs.namespace.tech/namespace-platform/manager)

## 2. Generate minting parameters

After we list ENS name, our platform allows minting subnames under it. We can use a library to check for subname availability and to generate a mint transaction parameters.

```typescript
import { createNamespaceClient, SetRecordsRequest, MintTransactionParameters } from "namespace-sdk";
import { sepolia } from "viem/chains";

const namespaceClient = createNamespaceClient({
  chainId: sepolia.id,
});

const LISTED_NAME = "namespace-sdk.eth"
const ETH_COIN_TYPE = 60;

const generateMintingParameters = async (): Promise<MintTransactionParameters> => {

  // Get listed name from namespace api
  const listedName = await namespaceClient.getListedName(
    LISTED_NAME,
    sepolia.id
  );

  const subnameLabel = "myfunnylabel";
  const minterAddress = "0x6CaBE5E77F90d58600A3C13127Acf6320Bee0aA7"

  // Check for name availability
  const isNotTaken = await namespaceClient.isSubnameAvailable(
    listedName,
    subnameLabel
  );
  
  if (!isNotTaken) {
    throw Error("Subname is already taken!");
  }

   // Generate mint transcation parameters
  const mintDetails = await namespaceClient.getMintTransactionParameters(listedName, {
    minterAddress: minterAddress,
    subnameLabel: subnameLabel,
    subnameOwner: minterAddress,
    // Optionaly, we can also set resolver records with the mint transaction
    records: {
        addresses: [
            {
                address: minterAddress,
                coinType: ETH_COIN_TYPE
            }
        ],
        texts: [
            {
                key: "name",
                value: "namespace"
            }
        ]
    }
  });
  return mintDetails;
};
```
## 3. Send Transaction
Sending a transaction is the last step. Since the library uses Viem under the hood, we will use WalletClient to send a transaction.

```typescript
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";
import { generateMintingParameters } from "./minting";

const sendMintTransaction = async () => {

    // Import your wallet and create a Viem Wallet Client
    const wallet = privateKeyToAccount("0xYourWallet");
    const walletClient = createWalletClient({
        transport: http(),
        chain: sepolia,
        account: wallet
    })

    // Generate minting parameters
    const mintParams = await generateMintingParameters();

    // Send transaction
    const transactionHash = await walletClient.writeContract({
        abi: mintParams.abi,
        address: mintParams.contractAddress,
        functionName: mintParams.functionName,
        args: mintParams.args,
        value: mintParams.value
    })

    console.log(transactionHash);
}
```
## Authors
[artii.eth](https://github.com/nenadmitt)