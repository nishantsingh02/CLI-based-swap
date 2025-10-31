require("dotenv").config();
const { Connection, Keypair, VersionedTransaction } = require('@solana/web3.js');
const axios = require('axios');
const { Wallet } = require('@project-serum/anchor');
const bs58 = require('bs58');

// const connection = new Connection('https://api.mainnet-beta.solana.com');
const connection = new Connection('https://solana-mainnet.g.alchemy.com/v2/8y8Hi7MthK7hmykqgbvfg');

// this is a in-memory wallet
const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY)));

async function main() {
  // get the quate 
    const response = await (
      // its convert 0.1 sol to usdc amount = 0.01 inputMint = Sol outputMint = usdc
        await axios.get('https://lite-api.jup.ag/swap/v1/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=100000000&slippageBps=50&restrictIntermediateTokens=true'
        )
      );
      const quoteResponse = response.data;
      console.log(quoteResponse);

      try {
        // swap request
        // return the transection object
        const { data: { swapTransaction } } = await (
            await axios.post('https://quote-api.jup.ag/v6/swap', {
                quoteResponse,
                userPublicKey: wallet.publicKey.toString(),
            })
        );

        console.log("swapTransaction")
        const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
        var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        console.log(transaction);
          
        // sign the transection by using private key
        transaction.sign([wallet.payer]);
        const latestBlockHash = await connection.getLatestBlockhash();

        // send the transection to the blockchain
        const rawTransaction = transaction.serialize()
        const txid = await connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
            maxRetries: 2
        });
        // confirm the transection
        await connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: txid
        });
        console.log(`https://solscan.io/tx/${txid}`);
      } catch(e) {
        console.log(e)
      }
      
}

main();