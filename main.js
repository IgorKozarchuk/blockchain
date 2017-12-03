// Blockchain implementation (with Proof-of-Work)
// https://www.youtube.com/watch?v=zVqczFZr124
// https://www.youtube.com/watch?v=HneatE69814

const SHA256 = require("crypto-js/sha256.js");

class Block {
	constructor(index, timestamp, data, prevHash = "") {
		this.index = index;
		this.timestamp = timestamp;
		this.data = data;
		this.prevHash = prevHash;
		this.hash = this.calculateHash();
		this.nonce = 0;
	}
	calculateHash() {
		return SHA256(this.index + this.timestamp + JSON.stringify(this.data) + this.nonce + this.prevHash).toString();
	}
	mineBlock(difficulty) {
		while (this.hash.substring(0, difficulty) !== new Array(difficulty + 1).join("0")) {
			this.nonce++;
			this.hash = this.calculateHash();
		}
		console.log("Block mined: " + this.hash);
	}
}

class Blockchain {
	constructor() {
		this.chain = [this.createGenesisBlock()];
		this.difficulty = 4;
	}
	createGenesisBlock() {
		return new Block(0, "01/01/2017", "Genesis Block", "0");
	}
	getLatestBlock() {
		return this.chain[this.chain.length - 1];
	}
	addBlock(newBlock) {
		newBlock.prevHash = this.getLatestBlock().hash;
		newBlock.mineBlock(this.difficulty);
		this.chain.push(newBlock);
	}
	isChainValid() {
		for (let i = 1; i < this.chain.length; i++) {
			const currentBlock = this.chain[i];
			const prevBlock = this.chain[i - 1];
			if (currentBlock.hash !== currentBlock.calculateHash()) {
				return false;
			}
			if (currentBlock.prevHash !== prevBlock.hash) {
				return false;
			}
		}
		return true;
	}
}

// test - in terminal run command: node main.js
// or use webpack or broweserify (http://browserify.org/)
// browserify main.js -o bundle.js
let myCoin = new Blockchain();

console.log("Mining block 1...");
myCoin.addBlock(new Block(1, "02/01/2017", {amout: 4}));

console.log("Mining block 2...");
myCoin.addBlock(new Block(2, "03/01/2017", {amout: 10}));

// console.log(JSON.stringify(myCoin, "", 2));
// console.log("Is blockchain valid: " + myCoin.isChainValid());

// myCoin.chain[1].data = {amount: 100};
// myCoin.chain[1].hash = myCoin.chain[1].calculateHash();

// console.log(JSON.stringify(myCoin, "", 2));
// console.log("Is blockchain valid: " + myCoin.isChainValid());

var destElem = document.getElementById("destination");
document.getElementById("btn").onclick = function() {
	destElem.innerHTML = JSON.stringify(myCoin, "", 2);
};
