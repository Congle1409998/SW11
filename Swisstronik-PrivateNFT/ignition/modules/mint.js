const hre = require("hardhat");
const { encryptDataField, decryptNodeResponse } = require("@swisstronik/utils");

const sendShieldedTransaction = async (signer, destination, data, value) => {
  const rpcLink = hre.network.config.url;

  const [encryptedData] = await encryptDataField(rpcLink, data);

  return await signer.sendTransaction({
    from: signer.address,
    to: destination,
    data: encryptedData,
    value,
  })
}

async function main() {
  const contractAddress = "0x31FC680775E3Dcea5af2e4e51947429B36069200";

  const [signer] = await ethers.getSigners()

  const contractFactory = await ethers.getContractFactory('PrivateNFT')
  const contract = contractFactory.attach(contractAddress)

  const mintFunctionName = 'mintNFT'
  const recipientAddress = signer.address
  const mintTx = await sendShieldedTransaction(
    //@ts-ignore
    signer,
    contractAddress,
    contract.interface.encodeFunctionData(mintFunctionName, [recipientAddress]),
    0
  )
  const mintReceipt = await mintTx.wait()
  console.log('Mint Transaction Hash: ', `https://explorer-evm.testnet.swisstronik.com/tx/${mintTx.hash}`)

  const mintEvent = mintReceipt?.logs
    .map((log) => {
      try {
        return contract.interface.parseLog(log)
      } catch (e) {
        return null
      }
    })
    .find((event) => event && event.name === 'NFTMinted')
  const tokenId = mintEvent?.args?.tokenId
  console.log('Minted NFT ID: ', tokenId.toString())
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})