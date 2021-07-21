/**
 * @fileOverview CSPR JS SDK demo: ERC20 - view contract balances.
 */

var _ = require('lodash');

const caspersdk = require('casper-js-sdk');
const Keys = caspersdk.Keys;
const CasperClient = caspersdk.CasperClient;
const CasperServiceByJsonRPC = caspersdk.CasperServiceByJsonRPC;

const CONTRACT_NAME = "CasperDIDRegistry2";
const DEPLOY_HASH = '21ae214f411c8a273effd283ec88e3664500791da4955aef385bb62a8ec40924';
const DEPLOY_NODE_ADDRESS = 'http://128.199.63.141:7777/rpc';
const DEPLOY_CHAIN_NAME = 'casper-test';
const KEY = 'asd';

const main = async () => {
    // Step 1: Set casper node client.
    const client = new CasperClient(DEPLOY_NODE_ADDRESS);
    const clientRpc = new CasperServiceByJsonRPC(DEPLOY_NODE_ADDRESS);

    // Step 2: Set contract operator key pair.
    const keyPairOfContract = Keys.Ed25519.parseKeyFiles(
        './network_keys/ippolit/IppolitWallet_public_key.pem',
        './network_keys/ippolit/IppolitWallet_secret_key.pem'
    );

    const user1 = Keys.Ed25519.parseKeyFiles(
        './network_keys/user1/public_key.pem',
        './network_keys/user1/secret_key.pem'
    );
    console.log("User1 acc hash:");
    console.log(user1.accountHash());
    // Step 3: Query node for global state root hash.
    const stateRootHash = await clientRpc.getStateRootHash();

    // Step 4: Query node for contract hash.
    const contractHash = await getAccountNamedKeyValue(client, stateRootHash, keyPairOfContract, CONTRACT_NAME);

    // Step 5: Query node for token symbol.
    //const asdres = await getStateKeyValue(client, stateRootHash, contractHash, KEY);
    let asdResult = await clientRpc.getBlockState(stateRootHash,contractHash,[KEY])
    console.log("asdres:");
    console.log(asdResult);
   
};

const getStateKeyValue = async (client, stateRootHash, stateKey, statePath) => {
    // Chain query: get global state key value. 
    let result = await client.nodeClient.getBlockState(
        stateRootHash,
        stateKey,
        [statePath]
    );
    return result;
};

const getAccountInfo = async (client, stateRootHash, keyPair) => {
    const accountHash = Buffer.from(keyPair.accountHash()).toString('hex');
    const { Account: accountInfo } = await client.nodeClient.getBlockState(
        stateRootHash,
        `account-hash-${accountHash}`,
        []
    );
    return accountInfo;
};

const getAccountNamedKeyValue = async (client, stateRootHash, keyPair, namedKey) => {
    // Chain query: get account information. 
    const accountInfo = await getAccountInfo(client, stateRootHash, keyPair);
    
    // Get value of contract v1 named key.
    let res = _.find(accountInfo.namedKeys, (i) => { return i.name === namedKey });
    return res.key;
};

main();
 