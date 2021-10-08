var _ = require('lodash');
const caspersdk = require('casper-js-sdk');
const { identity } = require('lodash');
const Keys = caspersdk.Keys;
const CasperClient = caspersdk.CasperClient;
const CLValueBuilder = caspersdk.CLValueBuilder;
const CLPublicKeyTag = caspersdk.CLPublicKeyTag;
const CasperServiceByJsonRPC = caspersdk.CasperServiceByJsonRPC;

const { CONTRACT_HASH, 
        DEPLOY_NODE_ADDRESS,
        DEPLOY_CHAIN_NAME,
        IPPOLIT_KEY_PUBLIC_PATH,
        IPPOLIT_KEY_SECRET_PATH,
        TRENT_KEY_SECRET_PATH,
        TRENT_KEY_PUBLIC_PATH ,
        VICTOR_KEY_SECRET_PATH,
        VICTOR_KEY_PUBLIC_PATH} = require("../constants");
const { CLValue } = require('casper-js-sdk');

const readOwner = async(_identity) => {
    // Step 1: Set casper node client.
    const client = new CasperClient(DEPLOY_NODE_ADDRESS);
    const clientRpc = new CasperServiceByJsonRPC(DEPLOY_NODE_ADDRESS);

    // Step 3: Query node for global state root hash.
    const stateRootHash = await clientRpc.getStateRootHash();

    let key = "owner_"+Buffer.from(_identity.accountHash()).toString('hex');

    // Step 5: Query node for value by key.
    try{
        let result = await clientRpc.getBlockState(stateRootHash,CONTRACT_HASH,[key])
        console.log("owner_identity: ",Buffer.from(result["CLValue"]["data"]).toString('hex'));
    }catch{
        console.log("owner isn't instantiated");
    }
}



const readDelegate = async(_identity, _delegateType, _delegate) => {
    // Step 1: Set casper node client.
    const client = new CasperClient(DEPLOY_NODE_ADDRESS);
    const clientRpc = new CasperServiceByJsonRPC(DEPLOY_NODE_ADDRESS);

    // Step 3: Query node for global state root hash.
    const stateRootHash = await clientRpc.getStateRootHash();
    // Step 5: Query node for value by key.
    try{
        let result = await clientRpc.getBlockState(stateRootHash,CONTRACT_HASH,[key])
        console.log("delegate result:");
        console.log(result);
    }catch{
        console.log("delegate isn't instantiated");
    }
}

const readAttribute = async(_identity, _name) => {
    // Step 1: Set casper node client.
    const client = new CasperClient(DEPLOY_NODE_ADDRESS);
    const clientRpc = new CasperServiceByJsonRPC(DEPLOY_NODE_ADDRESS);

    // Step 3: Query node for global state root hash.
    const stateRootHash = await clientRpc.getStateRootHash();
    // Step 5: Query node for value by key.
    // Step 5: Query node for value by key.
    try{
        let result = await clientRpc.getBlockState(stateRootHash,CONTRACT_HASH,[key])
        console.log("attribute result:");
        console.log(result["CLValue"]["data"][0]);
        console.log(result["CLValue"]["data"][1]);
    }catch{
        console.log("attribute isn't instantiated");
    }
}

const main = async () => {
    const ippolit = Keys.Ed25519.parseKeyFiles(
        IPPOLIT_KEY_PUBLIC_PATH,
        IPPOLIT_KEY_SECRET_PATH
    );
    let trent = Keys.Ed25519.parseKeyFiles(
        TRENT_KEY_PUBLIC_PATH,
        TRENT_KEY_SECRET_PATH
    );
    let victor = Keys.Ed25519.parseKeyFiles(
        VICTOR_KEY_PUBLIC_PATH,
        VICTOR_KEY_SECRET_PATH
    );
    
    let identity = ippolit;
    console.log("Read Owner for Trent");
    await readOwner(trent);
    console.log("Read Owner for Victor");
    await readOwner(victor);
    let delegateType = ippolit;
    let delegate = trent;
    await readDelegate(identity,delegateType,delegate);
    let name = "service-endpoint"
    await readAttribute(identity,name);
   
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
 