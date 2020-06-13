var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var io_client = require('socket.io-client');
var express = require("express");
const fs = require('fs');
const blockJson = require('./data.json');
//ganti dengan ipv4 server (contoh : 'http://{ipv4}:{port}/')
var socket_node = io_client.connect('http://192.168.1.9:3001/', {reconnect: true});

const SHA256 = require('crypto-js/sha256');

const CryptoJS = require("crypto-js");

//import model
const BlockChain = require('./Blockchain.js');
const Block = require('./Block.js');

//initialize model
const blockchain = new BlockChain();

var index = 1;
var previous_hash = 'Genesis Hash'

app.use(express.static('public'));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

function generateSalt(index) {
	/**
	 * Generate salt berdasarkan index block dengan memasukannya
	 * kesebuah algoritma
	 * 
	 * @params int var index
	 * @return str var hash_pattern
	 * 
	 * */

	var pattern = Math.pow((2*index),3);
	var string_pattern = pattern.toString();
	var hash_pattern = SHA256(string_pattern).toString();
	return hash_pattern;
};

socket_node.on('connect', function() {
	/**
	 * Menerima data dari node lain
	 * 
	 * */

	console.log('socket connection to server 1');
	socket_node.on('node_comm', function (data) {
		/**
		 * Menerima block yang masih di encrypt dari node lain. Fungsi ini
		 * melakukan proses decrypt dan memvalidasi block sebelum dimasukan
		 * ke blockchain
		 * 
		 * @params Block var data
		 * @return void
		 * 
		 */

		var bytes  = CryptoJS.AES.decrypt(data, 'kunci rahasia');
		var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

		var block = new Block(decryptedData.index, decryptedData.data, decryptedData.timestamp, decryptedData.nonce, decryptedData.hash, decryptedData.previous_hash);
		var previous_block = blockchain.getNewestBlockFromBlockchain();

		if (block.validateBlock(block, previous_block) != 0) {
			console.log('Error code : ' + block.validateBlock(block, previous_block));
		} else {
			blockchain.addBlock(block);
			blockchain.showBlockchain();

			index = block.index + 1;
			previous_hash = block.hash;
		}
	});

	socket_node.on('blockchain_request', function() {
		/**
		 * Menerima request blockchain dari node lain. Mengirimkan
		 * blockchain kepada node yang memintanya.
		 * 
		 * @params null
		 * @return void
		 * 
		 */

		console.log('sending blockchain');
		io.emit('blockchain_response', blockchain);
	});

	socket_node.on('blockchain_response',function(blockchain_response) {
		/**
		 * Menerima blockchain node lain
		 * 
		 * @params Blockchain blockchain_response
		 * @return void
		 * 
		 */

		console.log('recieving blockchain');
		blockchain.replaceBlockchain(blockchain_response);
	});
});

io.on('connection', function(socket){
	/**
	 * Menerima koneksi dari client
	 * 
	 * @params SocketIO.Socket socket
	 * @return void
	 * 
	 */

	console.log('a user connected');
	socket.on('vote_input', function (data) {
		/**
		 * Menerima vote dari client. Fungsi ini membangun komponen-komponen block
		 * setelah menerima vote client. Setelah block dibangun, fungsi akan
		 * memvalidasi block dan blockchain tersebut, serta encrypt block untuk
		 * dikirim ke node lain.
		 * 
		 * Jika block atau blockchain gagal di validasi, maka inputan gagal dimasukan
		 * ke blockchain. Khususnya jika blockchain gagal di validasi, sistem akan
		 * request copy blockchain kepada node lainnya untuk menimpa blockchain saat ini.
		 * 
		 * @params str data
		 * @return void
		 * 
		 */

		var dateobj = new Date();
		var timestamp = dateobj.toUTCString();

		var salt = generateSalt(index);

		var nonce = SHA256(data + salt).toString();
		var hash = SHA256(index.toString() + data + timestamp + nonce + previous_hash).toString();

		var local_block = {
			'index' : index,
			'data' : data,
			'timestamp' : timestamp,
			'nonce' : nonce,
			'hash' : hash,
			'previous_hash' : previous_hash
		};

		var block = new Block(local_block.index, local_block.data, local_block.timestamp, local_block.nonce, local_block.hash, local_block.previous_hash);
		
		var previous_block = blockchain.getNewestBlockFromBlockchain();

        if (block.validateBlock(block, previous_block) != 0) {
			console.log('Error code : ' + block.validateBlock(block, previous_block));
        } else {

			if (blockchain.validateChain() == false) {
				blockchain.validateChain();
				io.emit('blockchain_request');
				// blockchain.showBlockchain();
			} else {

				blockchain.addBlock(block);
				// blockchain.showLatestBlock();
				blockchain.showBlockchain();

				let newBlock = blockJson;
				newBlock.push(block);
				
			
				var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(block), 'kunci rahasia').toString();
				io.emit('node_comm', ciphertext);
				var save = fs.writeFileSync('data.json', JSON.stringify(newBlock,0,2));
				io.emit('vote_input', save);

				previous_hash = hash;
				index = index + 1;
			}

        }

	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});