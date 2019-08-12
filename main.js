// Blockchain implementation (with Proof-of-Work)
// https://www.youtube.com/watch?v=SSo_EIwHSd4
// https://www.youtube.com/watch?v=zVqczFZr124
// https://www.youtube.com/watch?v=HneatE69814
// https://www.youtube.com/watch?v=fRV6cGXVQ4I
// https://www.youtube.com/watch?v=kWQ84S13-hw

// hash function
// npm i crypto-js
const SHA256 = require("crypto-js/sha256.js");
// library for generating public and private keys
// npm i elliptic
const EC = require("elliptic").ec;

const ec = new EC("secp256k1");
// generate public & private key pair
const key = ec.genKeyPair();
const publicKey = key.getPublic("hex");
const privateKey = key.getPrivate("hex");

console.log("Public key: " + publicKey);
console.log("Private key: " + privateKey);

class Transaction {
	constructor(fromAddress, toAddress, amount) {
		this.fromAddress = fromAddress;
		this.toAddress = toAddress;
		this.amount = amount;
		this.timestamp = Date.now();
	}
	calculateTxHash() {
		return SHA256(this.fromAddress + this.toAddress + this.amount + this.timestamp).toString();
	}
	signTransaction(signingKey) {
		if (signingKey.getPublic("hex") !== this.fromAddress) {
			throw new Error("You cannot sign transactions for other wallets!");
		}
		const hashTx = this.calculateTxHash();
		const sig = signingKey.sign(hashTx, "base64");
		this.signature = sig.toDER("hex");
	}
	isTxValid() {
		if (this.fromAddress === null) { // reward Tx
			return true;
		}
		if (!this.signature || this.signature.length === 0) {
			throw new Error("No signature in this transaction");
		}
		const publicKey = ec.keyFromPublic(this.fromAddress, "hex");
		return publicKey.verify(this.calculateTxHash(), this.signature);
	}
}

class Block {
	constructor(timestamp, transactions, prevHash = "") {
		this.timestamp = timestamp;
		this.transactions = transactions;
		this.prevHash = prevHash;
		this.hash = this.calculateHash();
		// number which has nothing to do with a block
		// but is changed while mining block to a given difficulty
		// (calculating hash with certain amount of 0s)
		// as we can't change timestamp, transactions, prevHash
		this.nonce = 0;
	}
	calculateHash() {
		return SHA256(this.timestamp + JSON.stringify(this.transactions) + this.prevHash + this.nonce).toString();
	}
	mineBlock(difficulty) {
		// while amount of 0s in hash != to difficulty
		while (this.hash.substring(0, difficulty) !== new Array(difficulty+1).join("0")) {
			this.nonce++;
			this.hash = this.calculateHash();
		}
		console.log("Block mined: " + this.hash);
	}
	// validate all transactions in the current block
	areTransactionsValid() {
		for (const tx of this.transactions) {
			if (!tx.isTxValid) {
				return false;
			}
		}
		return true;
	}
}

class Blockchain {
	constructor() {
		this.chain = [this.createGenesisBlock()];
		this.difficulty = 4; // amount of 0s in hash - proof of work
		this.pendingTransactions = []; // transactions to be mined and added to a block
		this.miningReward = 100; // amount of coins a miner gonna get as a reward
	}
	createGenesisBlock() { // 1st block in the blockchain
		return new Block(Date.parse("2019-01-01"), [], "0");
	}
	getLatestBlock() {
		return this.chain[this.chain.length-1];
	}
	minePendingTransactions(miningRewardAddress) {
		// create a new transaction to give the miner his award
		const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
		this.pendingTransactions.push(rewardTx);
		// create new block
		let newBlock = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
		newBlock.mineBlock(this.difficulty);
		console.log("Block of pending transactions successfully mined!");
		this.chain.push(newBlock);
		// reset pendingTransactions
		this.pendingTransactions = [];
	}
	addTransaction(transaction) {
		if (!transaction.fromAddress || !transaction.toAddress) {
			throw new Error("Transaction must include from and to address");
		}
		if (!transaction.isTxValid()) {
			throw new Error("Cannot add invalid transaction to chain");
		}
		if (transaction.amount <= 0) {
			throw new Error("Transaction amount must be higher than 0");
		}
		// if (transaction.amount > this.getBalanceOfAddress(transaction.fromAddress)) {
		// 	throw new Error("Transaction amount must not be higher than sender's balance");
		// }
		this.pendingTransactions.push(transaction);
	}
	getBalanceOfAddress(address) {
		let balance = 0;
		for (const block of this.chain) {
			for (const trans of block.transactions) {
				if (trans.fromAddress === address) {
					balance -= trans.amount;
				}
				if (trans.toAddress === address) {
					balance += trans.amount;
				}
			}
		}
		return balance;
	}
	getAllTransactionsForWallet(address) {
		const txs = [];
		for (const block of chain) {
			for (const tx of block.transactions) {
				if (tx.fromAddress === address || tx.toAddress === address) {
					txs.push(tx);
				}
			}
		}
		return txs;
	}
	isChainValid() {
		// check if the Genesis block hasn't been tampered with by comparing
		// the output of createGenesisBlock with the first block on our chain
		const realGenesis = JSON.stringify(this.createGenesisBlock());
		if (realGenesis !== JSON.stringify(this.chain[0])) {
			return false;
		}
		// check the remaining blocks on the chain to see
		// if there hashes and signatures are correct
		for (let i = 1; i < this.chain.length; i++) {
			const currentBlock = this.chain[i];
			if (!currentBlock.areTransactionsValid()) {
				return false;
			}
			if (currentBlock.hash !== currentBlock.calculateHash()) {
				return false;
			}
		}
		return true;
	}
}

// test - in terminal run command: node main.js
// or use webpack or broweserify (http://browserify.org/)
// browserify main.js -o bundle.js
const myKey = ec.keyFromPrivate("1beedf9089bcecdf6af68afdd68c4f09e51b33743f1f5c1d47e0f8dc07dfe91c");
const myWalletAddress = myKey.getPublic("hex");

let myCoin = new Blockchain();

const tx1 = new Transaction(myWalletAddress, "public key of recipient goes here", 10);
tx1.signTransaction(myKey);

myCoin.addTransaction(tx1);

console.log("Starting the miner...");
myCoin.minePendingTransactions(myWalletAddress);
console.log("Balance of miner is: " + myCoin.getBalanceOfAddress(myWalletAddress));

console.log("Is chain valid? " + myCoin.isChainValid());
myCoin.chain[1].transactions[0].amount = 1;
console.log("Is chain valid? " + myCoin.isChainValid());

// html button
var destElem = document.getElementById("destination");
document.getElementById("btn").onclick = function() {
	destElem.innerHTML = JSON.stringify(myCoin, "", 2);
};