/**
 * @fileOverview CSPR JS SDK demo: ERC20 - view contract balances.
 */

var _ = require('lodash');

const caspersdk = require('casper-js-sdk');
const { identity } = require('lodash');
const Keys = caspersdk.Keys;
const CasperClient = caspersdk.CasperClient;
const CasperServiceByJsonRPC = caspersdk.CasperServiceByJsonRPC;

const { CONTRACT_NAME, 
        DEPLOY_NODE_ADDRESS,
        DEPLOY_CHAIN_NAME } = require("./constants");
const { CLValue } = require('casper-js-sdk');

const readIdentity = async(_identity) => {
    // Step 1: Set casper node client.
    const client = new CasperClient(DEPLOY_NODE_ADDRESS);
    const clientRpc = new CasperServiceByJsonRPC(DEPLOY_NODE_ADDRESS);

    // Step 2: Set contract operator key pair.
    const keyPairOfContract = Keys.Ed25519.parseKeyFiles(
        './network_keys/ippolit/IppolitWallet_public_key.pem',
        './network_keys/ippolit/IppolitWallet_secret_key.pem'
    );

    console.log("identity acc hash:");
    console.log(_identity.accountHash());
    // Step 3: Query node for global state root hash.
    const stateRootHash = await clientRpc.getStateRootHash();

    // Step 4: Query node for contract hash.
    const contractHash = await getAccountNamedKeyValue(client, stateRootHash, keyPairOfContract, CONTRACT_NAME);
    
    let key = "owner_"+Buffer.from(_identity.accountHash()).toString('hex');

    // Step 5: Query node for token symbol.
    let result = await clientRpc.getBlockState(stateRootHash,contractHash,[key])
    console.log("owner_identity:");
    console.log(result);
};

const asd = async (key) => {
     // Step 1: Set casper node client.
    const client = new CasperClient(DEPLOY_NODE_ADDRESS);
    const clientRpc = new CasperServiceByJsonRPC(DEPLOY_NODE_ADDRESS);

    // Step 2: Set contract operator key pair.
    const keyPairOfContract = Keys.Ed25519.parseKeyFiles(
        './network_keys/ippolit/IppolitWallet_public_key.pem',
        './network_keys/ippolit/IppolitWallet_secret_key.pem'
    );

    // Step 3: Query node for global state root hash.
    const stateRootHash = await clientRpc.getStateRootHash();

    // Step 4: Query node for contract hash.
    const contractHash = await getAccountNamedKeyValue(client, stateRootHash, keyPairOfContract, CONTRACT_NAME);
    
    //let key = "asd";

    // Step 5: Query node for token symbol.
    let result = await clientRpc.getBlockState(stateRootHash,contractHash,[key])
    if(key == "asd1"){
        console.log(key+": ");
        for(var i in result){
            console.log(i);
        }
        console.log(result["CLValue"]["data"][1]);
    }else{
        console.log(key+": ");
        console.log(result);
    }
}


const main = async () => {
    const ippolit = Keys.Ed25519.parseKeyFiles(
        './network_keys/ippolit/IppolitWallet_public_key.pem',
        './network_keys/ippolit/IppolitWallet_secret_key.pem'
    );
    let user1 = Keys.Ed25519.parseKeyFiles(
        './network_keys/user1/public_key.pem',
        './network_keys/user1/secret_key.pem'
    );
    console.log("ippolit acc hash");
    console.log(ippolit.accountHash());
    //await readIdentity(ippolit);
    await asd("asd1");
    await asd("asd2");
    await asd("asd3");
    await asd("asd4");
   
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
 