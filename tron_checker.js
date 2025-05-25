const fetch = require('node-fetch');
const bs58 = require('bs58');
const bs58check = require('bs58check');

/**
 * Get TRX transfer history for a given address.
 * @param {string} address - The TRON address to check.
 */

function hextoBase58(hex) {
    const buffer = Buffer.from(hex, 'hex');
    const base58 = bs58check.default.encode(buffer);
    return base58;
}

async function getTRXTransfers(address) {
    try {
        // Use TronGrid API to get TRX transfers
        const url = `https://api.trongrid.io/v1/accounts/${address}/transactions?only_confirmed=true&limit=50`;
        const response = await fetch(url);
        const data = await response.json();

        const transactions = data.data || [];

        if (transactions.length === 0) {
            console.log('No TRX transfer history found for this address.');
            return;
        }

        transactions.forEach(tx => {
            const contract = tx.raw_data.contract[0];
            if (contract.type === "TransferContract") {
                const from = hextoBase58(contract.parameter.value.owner_address);
                const to = hextoBase58(contract.parameter.value.to_address);
                const value = tx.raw_data.contract[0].parameter.value.amount / 1e6;
                console.log(`From: ${from} | To: ${to} | Value: ${value} TRX`);
            }
        });
    } catch (error) {
        console.error('Error fetching TRX transfer history:', error);
    }
}

const [,, address] = process.argv;

if (!address) {
    console.log('Usage: node tron_checker.js <address>');
    process.exit(1);
}

getTRXTransfers(address);
