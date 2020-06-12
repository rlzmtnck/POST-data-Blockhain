/**
 * Model blockchain. Deklarasi method-method yang dimiliki oleh
 * sebuah blockchain
 * 
 */

const Block = require('./block');
const SHA256 = require('crypto-js/sha256');

class Blockchain {
    constructor() {
        /**
         * Fungsi awal yang dijalankan untuk mendeklarasi empty array dan menyimpan
         * genesis block
         * 
         * @params none
         * @return void
         * 
         */
        var dateobj = new Date();
        // var timestamp = dateobj.toUTCString();

        this.blockchain = [];
        this.addBlock(new Block(0, 'Genesis', 0, 'Genesis Nonce', 'Genesis Hash', 'Genesis Previous_Hash'));
    }

    replaceBlockchain(blockchain) {
        /**
         * Fungsi untuk menggantikan blockchain sistem dengan blockchain dari node
         * lain
         * 
         * @params Blockchain blockchain
         * @retun void
         * 
         */
        this.blockchain = [];

        for(var i = 0; i < blockchain['blockchain'].length; i++) {
            var block = blockchain['blockchain'][i];
            this.addBlock(
                new Block(
                    block.index, 
                    block.data, 
                    block.timestamp, 
                    block.nonce, 
                    block.hash, 
                    block.previous_hash));
            console.log(block);
        }
    }

    validateChain() {
        /**
         * Validasi semua komponen blockchain kecuali timestamp dan data
         * 
         * @params none
         * @return bool
         * 
         */
        for(var i = 0; i < this.blockchain.length; i++) {

            //cek index
            if (this.blockchain[i]['index'] != i) {
                console.log('Invalid Index');
                return false;
            }
            
            //cek nonce
            if (i != 0) {
                var pattern = Math.pow((2*this.blockchain[i]['index']),3);
                var string_pattern = pattern.toString();
                var hash_pattern = SHA256(string_pattern).toString();
                var real_block_nonce = SHA256(this.blockchain[i]['data'] + hash_pattern).toString();
                
                if(real_block_nonce != this.blockchain[i]['nonce']) {
                    console.log('Invalid Nonce');

                    return false;
                }
            } else {
                if (this.blockchain[i]['nonce'] != 'Genesis Nonce') {
                     console.log('Invalid Nonce');

                    return false;
                }
            }

            //cek hash
            if (i != 0) {
                var real_hash = SHA256(this.blockchain[i]['index'].toString() + this.blockchain[i]['data'] + this.blockchain[i]['timestamp'] + this.blockchain[i]['nonce'] + this.blockchain[i]['previous_hash']).toString();
                if (real_hash != this.blockchain[i]['hash']) {
                     console.log('Invalid Hash');

                    return false;
                }
            } else {
                if (this.blockchain[i]['hash'] != 'Genesis Hash') {
                    return false;
                }
            }

            //cek previous_hash
            if (i != 0) {
                if (this.blockchain[i]['previous_hash'] != this.blockchain[i-1]['hash']) {
                    console.log('Invalid Previous Hash');
                    
                    return false;
                }
            }
        }
        return true;
    }

    addBlock(block) {
        /**
         * Memasukan block kepada array blockchain
         * 
         * @params Block block
         * @return void
         * 
         */
        this.blockchain.push(block);
    }

    showBlockchain() {
        /**
         * Output keseluruhan data blockchain di console
         * 
         * @params none
         * @return void
         * 
         */
        for (var i = 0; i < this.blockchain.length; i++) {
            console.log(this.blockchain[i]);
        }
    }

    showLatestBlock() {
        /**
         * Output block paling baru di console
         * 
         * @params none
         * @return void
         * 
         */
        console.log(this.blockchain[this.blockchain.length-1]);
    }

    getNewestBlockFromBlockchain() {
        /**
         * Get block paling baru di blockchain
         * 
         * @params none
         * @return Block block
         * 
         */
        return this.blockchain[this.blockchain.length-1];
    }
}

module.exports = Blockchain;