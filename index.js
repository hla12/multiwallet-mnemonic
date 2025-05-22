
const bip39 = require('bip39');
const { HDNodeWallet } = require('ethers/wallet');
const { getBytes } = require('ethers/utils');    
const ethers = require('ethers');                 
const solanaWeb3 = require('@solana/web3.js');
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');
const bs58check = require('bs58check');
const bs58 = require('bs58'); 

const bip32 = BIP32Factory(ecc);

const EVM_PATH = "m/44'/60'/0'/0/0";    
const TRON_PATH = "m/44'/195'/0'/0/0";  
const SOLANA_PATH_PARENT = "m/44'/501'/0'"; 
const SOLANA_ACCOUNT_INDEX = "0"; 

/**
 * Generates a Tron address from an uncompressed public key.
 * @param {string} publicKeyHexWithPrefix - The uncompressed public key in hex format, starting with "0x04".
 * @returns {string} The Tron address.
 */

function getTronAddress(publicKeyHexWithPrefix) {
    if (!publicKeyHexWithPrefix || !publicKeyHexWithPrefix.startsWith('0x04')) {
        throw new Error('Public key for Tron address generation must be uncompressed, start with "0x04", and not be undefined.');
    }
    const pubKeyBytes = getBytes(publicKeyHexWithPrefix);
    const keyWithoutTypeByte = pubKeyBytes.slice(1);

    const hashedPublicKey = ethers.keccak256(keyWithoutTypeByte);

    const addressBytes = getBytes(hashedPublicKey).slice(-20);

    const tronAddressBytes = new Uint8Array(21);
    tronAddressBytes[0] = 0x41; 
    tronAddressBytes.set(addressBytes, 1);

    return bs58check.default.encode(Buffer.from(tronAddressBytes));
}


async function generateKeys() {
    console.log("Generating cryptographic keys...\n");

    // 1. Generate Mnemonic
    const mnemonic = bip39.generateMnemonic(256);
    console.log("🔑 Mnemonic Phrase (SAVE THIS SECURELY!):");
    console.log(mnemonic);
    console.log("--------------------------------------------------\n");

    // 2. Generate Seed from Mnemonic
    const seed = await bip39.mnemonicToSeed(mnemonic);
    console.log("🌱 Seed (Hex):");
    console.log(seed.toString('hex'));
    console.log("--------------------------------------------------\n");

    // 3. EVM (Ethereum, BSC, Polygon, etc.)
    console.log("🇪 Ethereum Virtual Machine (EVM) Compatible");
    try {
        const evmNode = HDNodeWallet.fromSeed(seed).derivePath(EVM_PATH);
        console.log("  Path:", EVM_PATH);
        console.log("  Address:", evmNode.address);
        console.log("  Private Key (Hex):", evmNode.privateKey);
    } catch (error) {
        console.error("  Error generating EVM keys:", error.message);
        console.error(error.stack);
    }
    console.log("--------------------------------------------------\n");

    // 4. TRC20 (Tron)
    console.log("🔗 TRC20 (Tron Network)");
    try {
        const tronNode = HDNodeWallet.fromSeed(seed).derivePath(TRON_PATH);
        console.log("  Path:", TRON_PATH);

        const tronPrivateKeyForWallet = tronNode.privateKey.startsWith('0x') ? tronNode.privateKey.substring(2) : tronNode.privateKey;
        console.log("  Private Key (Hex for TronLink):", tronPrivateKeyForWallet);

        const uncompressedPublicKeyHex = ethers.SigningKey.computePublicKey(tronNode.privateKey, false);
        const tronAddress = getTronAddress(uncompressedPublicKeyHex);
        console.log("  Tron Address:", tronAddress);

    } catch (error) {
        console.error("  Error generating TRC20 keys:", error.message);
        console.error(error.stack);
        console.error("  Make sure 'ethers' and 'bs58check' are installed.");
    }
    console.log("--------------------------------------------------\n");

    // 5. Solana
    console.log("☀️ Solana Network");
    const solanaFullDerivationPath = `${SOLANA_PATH_PARENT}/${SOLANA_ACCOUNT_INDEX}'`;
    try {
        const masterNode = bip32.fromSeed(seed);
        const solanaChildNode = masterNode.derivePath(solanaFullDerivationPath.substring(2));

        if (!solanaChildNode.privateKey) {
            throw new Error("Could not derive private key for Solana path: " + solanaFullDerivationPath);
        }
        const solanaAccountSeed = solanaChildNode.privateKey;
        const solanaKeypair = solanaWeb3.Keypair.fromSeed(solanaAccountSeed);

        console.log("  Path (derived for seed):", solanaFullDerivationPath);
        console.log("  Public Key (Address):", solanaKeypair.publicKey.toBase58());
        console.log("  Secret Key (Uint8Array format):", `[${solanaKeypair.secretKey.toString()}]`);
        console.log("  Secret Key (Base58):", bs58.default.encode(solanaKeypair.secretKey));

    } catch (error) {
        console.error("  Error generating Solana keys:", error.message);
        console.error(error.stack);
        console.error("  Make sure '@solana/web3.js', 'bip32', 'tiny-secp256k1' and 'bs58' are installed.");
    }
    console.log("--------------------------------------------------\n");

    console.log("✅ Generation Complete!");
}

generateKeys().catch(error => {
    console.error("Unhandled error in generateKeys:", error.message);
    console.error(error.stack);
});
