import { ethers } from "./ethers-6.7.min.js"
import { abi, contractAddress } from "./constants.js"

const connectButton = document.getElementById("connectButton")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")
const withdrawButton = document.getElementById("withdrawButton")
connectButton.onclick = connect
fundButton.onclick = fund
balanceButton.onclick = getBalance
withdrawButton.onclick = withdraw

async function connect() {
    let account
    try {
        if (typeof window.ethereum !== undefined) {
            account = await window.ethereum.request({
                method: "eth_requestAccounts",
            })
        } else {
            connectButton.innerHTML = "Please install metamask!"
        }

        if (account) {
            connectButton.style.backgroundColor = "rgb(22, 232, 57)"
            connectButton.style.letterSpacing = "1.1px"
            connectButton.style.cursor = "default"
            connectButton.innerHTML = `${account.toString().slice(0, 8)}.....${account.toString().slice(34, 42)}`
        }
    } catch (error) {
        const errorMessage =
            error.reason || error.message || "Unknown error occurred"
        alert(`Error: ${errorMessage}`)
    }
}

async function getBalance() {
    try {
        if (connectButton.innerHTML === "Connect Metamask") {
            throw new Error("Metamask not connected!")
        }
        if (typeof window.ethereum !== undefined) {
            const provider = new ethers.BrowserProvider(window.ethereum)
            const balance = await provider.getBalance(contractAddress)
            document.getElementById("balance").innerHTML =
                `Balance: ${ethers.formatEther(balance)} ETH`
            setTimeout(() => {
                document.getElementById("balance").innerHTML = ""
            }, 5000)
        }
    } catch (error) {
        const errorMessage =
            error.reason || error.message || "Unknown error occurred"
        alert(`Error: ${errorMessage}`)
        document.getElementById("ethAmount").value = ""
    }
}

async function fund() {
    try {
        if (connectButton.innerHTML === "Connect Metamask") {
            throw new Error("Metamask not connected!")
        }
        const ethAmount = document.getElementById("ethAmount").value
        console.log(`Funding with ${ethAmount}...`)
        // provider / connection to the blockchain
        // signer / wallet / someone with some gas
        // contract that we are interacting with
        // ^ ABI & Address

        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const contract = new ethers.Contract(contractAddress, abi, signer)

        const transactionResponse = await contract.fund({
            value: ethers.parseEther(ethAmount),
        })

        await listenForTransactionMine(transactionResponse, provider)
        console.log("Done!")
        document.getElementById("ethAmount").value = ""
    } catch (error) {
        const errorMessage =
            error.reason || error.message || "Unknown error occurred"
        alert(`Error: ${errorMessage}`)
        document.getElementById("ethAmount").value = ""
    }
}

function listenForTransactionMine(transactionResponse, provider) {
    console.log(`Mining ${transactionResponse.hash}...`)
    return new Promise((resolve, reject) => {
        provider.once(transactionResponse.hash, async (transactionReceipt) => {
            console.log(
                `Completed with ${await transactionReceipt.confirmations()} confirmations`,
            )
        })
        resolve()
    })
}

async function withdraw() {
    try {
        if (connectButton.innerHTML === "Connect Metamask") {
            throw new Error("Metamask not connected!")
        }
        if (typeof window.ethereum !== undefined) {
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const contract = new ethers.Contract(contractAddress, abi, signer)
            const owner = await contract.getOwner()

            if (owner.toString() !== signer.address) {
                throw new Error("Only owner can withdraw!")
            }
            const transactionResponse = await contract.withdraw()
            await listenForTransactionMine(transactionResponse, provider)
        }
    } catch (error) {
        const errorMessage =
            error.reason || error.message || "Unknown error occurred"
        alert(`Error: ${errorMessage}`)
    }
}
