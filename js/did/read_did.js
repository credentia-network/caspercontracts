var _ = require('lodash');
const caspersdk = require('casper-js-sdk');
const { identity } = require('lodash');
const Keys = caspersdk.Keys;
const CasperClient = caspersdk.CasperClient;
const CLValueBuilder = caspersdk.CLValueBuilder;
const CLPublicKeyTag = caspersdk.CLPublicKeyTag;
const CasperServiceByJsonRPC = caspersdk.CasperServiceByJsonRPC;

const { CONTRACT_DID_HASH, 
        CONTRACT_DID_NAME,
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

    let owner_key = "owner_"+Buffer.from(_identity.accountHash()).toString('hex');

    // Step 5: Query node for value by key.
    try{
        let result = await clientRpc.getBlockState(stateRootHash,CONTRACT_DID_HASH,[owner_key])
        console.log("owner_identity: ",Buffer.from(result["CLValue"]["data"]).toString('hex'));
    }catch{
        console.log("owner isn't instantiated");
    }
}

const readDelegateLength = async(identity) =>{
    // Step 1: Set casper node client.
    const client = new CasperClient(DEPLOY_NODE_ADDRESS);
    const clientRpc = new CasperServiceByJsonRPC(DEPLOY_NODE_ADDRESS);

    let delegateLength_key = Buffer.from(identity.accountHash()).toString('hex')+"_delegateLength";

    // Step 3: Query node for global state root hash.
    const stateRootHash = await clientRpc.getStateRootHash();
    // Step 5: Query node for value by key.
    try{
        let result = await clientRpc.getBlockState(stateRootHash,CONTRACT_DID_HASH,[delegateLength_key])
        console.log("Reading delegate result:");
        console.log("Delegate length: "+result['CLValue']['data'].toString());     
    }catch{
        console.log("Delegate length: 0");
    }
}

const readDelegate = async(identity, index) => {
    // Step 1: Set casper node client.
    const client = new CasperClient(DEPLOY_NODE_ADDRESS);
    const clientRpc = new CasperServiceByJsonRPC(DEPLOY_NODE_ADDRESS);

    let delegate_key = Buffer.from(identity.accountHash()).toString('hex')+"_delegate_"+index;

    // Step 3: Query node for global state root hash.
    const stateRootHash = await clientRpc.getStateRootHash();
    // Step 5: Query node for value by key.
    try{
        let result = await clientRpc.getBlockState(stateRootHash,CONTRACT_DID_HASH,[delegate_key])
        console.log("Reading delegate result:");
        //console.log(result);
        let delegateKey = result["CLValue"]["data"][0]['data'];
        let delegateValue = result["CLValue"]["data"][1]['data'];
        let expirationTimestamp = Number.parseInt(result["CLValue"]["data"][2]['data'].toString());

        console.log("Delegate Key: "+delegateKey);
        console.log("Delegate Value: "+delegateValue);
        console.log("Expiration date: "+(new Date(expirationTimestamp)));
    }catch{
        console.log("Delegate isn't instantiated");
    }
}

const readAttributeLength = async(identity) =>{
    // Step 1: Set casper node client.
    const client = new CasperClient(DEPLOY_NODE_ADDRESS);
    const clientRpc = new CasperServiceByJsonRPC(DEPLOY_NODE_ADDRESS);

    let attributeLength_key = Buffer.from(identity.accountHash()).toString('hex')+"_attributeLength";

    // Step 3: Query node for global state root hash.
    const stateRootHash = await clientRpc.getStateRootHash();
    // Step 5: Query node for value by key.
    try{
        let result = await clientRpc.getBlockState(stateRootHash,CONTRACT_DID_HASH,[attributeLength_key])
        console.log("Reading attribute length result:");
        console.log("Attribute length: "+result['CLValue']['data'].toString());
          
    }catch{
        console.log("Attribute length: 0");
    }
}

const readAttribute = async(identity, index) => {
   
    const client = new CasperClient(DEPLOY_NODE_ADDRESS);
    const clientRpc = new CasperServiceByJsonRPC(DEPLOY_NODE_ADDRESS);

    let attribute_key = Buffer.from(identity.accountHash()).toString('hex')+"_attribute_"+index;

    const stateRootHash = await clientRpc.getStateRootHash();
   
    try{
        let result = await clientRpc.getBlockState(stateRootHash,CONTRACT_DID_HASH,[attribute_key])
        console.log(result);
        let delegateKey = result["CLValue"]["data"][0]['data'];
        let delegateValue = result["CLValue"]["data"][1]['data'];
        let expirationTimestamp = Number.parseInt(result["CLValue"]["data"][2]['data'].toString());

        console.log("Attribute Key: "+delegateKey);
        console.log("Attribute Value: "+delegateValue);
        console.log("Expiration date: "+(new Date(expirationTimestamp)));
        
    }catch{
        console.log("Attribute isn't instantiated");
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
    
    
    
    let identity = trent;
    let index = 0;
    await readDelegateLength(identity);
    await readDelegate(identity,index);
    
    await readAttributeLength(identity);
    await readAttribute(identity,index);

    // const client = new CasperClient(DEPLOY_NODE_ADDRESS);
    // const clientRpc = new CasperServiceByJsonRPC(DEPLOY_NODE_ADDRESS);
    // const stateRootHash = await clientRpc.getStateRootHash();
    // let accinfo = await getAccountInfo(client,stateRootHash,trent);
    // console.log(accinfo);
   
   
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
    console.log(accountInfo);
    // Get value of contract v1 named key.
    let res = _.find(accountInfo.namedKeys, (i) => { return i.name === namedKey });
    return res.key;
};

main();
 