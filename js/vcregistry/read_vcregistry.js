/**
 * @fileOverview CSPR JS SDK demo: VCRegistry - view contract balances.
 */

var _ = require('lodash');

const caspersdk = require('casper-js-sdk');
const { identity } = require('lodash');
const Keys = caspersdk.Keys;
const CasperClient = caspersdk.CasperClient;
const CasperServiceByJsonRPC = caspersdk.CasperServiceByJsonRPC;

const { CONTRACT_VCREGISTRY_NAME, 
        DEPLOY_NODE_ADDRESS,
        DEPLOY_CHAIN_NAME } = require("../constants");
const { CLValue } = require('casper-js-sdk');


const readVerifiableCredentials = async(dataMerkleRoot,index)=>{
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
    const contractHash = await getAccountNamedKeyValue(client, stateRootHash, keyPairOfContract, CONTRACT_VCREGISTRY_NAME);

    let issuer_key = "verifiableCredentials_"+Buffer.from(dataMerkleRoot.accountHash()).toString('hex')+"_issuer";
    let dataMerkleRoot_key = "verifiableCredentials_"+Buffer.from(dataMerkleRoot.accountHash()).toString('hex')+"_dataMerkleRoot";
    let dateIssued_key = "verifiableCredentials_"+Buffer.from(dataMerkleRoot.accountHash()).toString('hex')+"_dateIssued";
    let status_key = "verifiableCredentials_"+Buffer.from(dataMerkleRoot.accountHash()).toString('hex')+"_status";
    let isRevokable_key = "verifiableCredentials_"+Buffer.from(dataMerkleRoot.accountHash()).toString('hex')+"_isRevokable";
    let statusChanges_length_key = "verifiableCredentials_"+Buffer.from(dataMerkleRoot.accountHash()).toString('hex')+"_statusChanges_length";
    let statusChanges_oldStatus_key = "verifiableCredentials_"+Buffer.from(dataMerkleRoot.accountHash()).toString('hex')+"_statusChanges_"+index+"_oldStatus";
    let statusChanges_newStatus_key = "verifiableCredentials_"+Buffer.from(dataMerkleRoot.accountHash()).toString('hex')+"_statusChanges_"+index+"_newStatus";
    let statusChanges_dateChanged_key = "verifiableCredentials_"+Buffer.from(dataMerkleRoot.accountHash()).toString('hex')+"_statusChanges_"+index+"_dateChanged";
    let statusChanges_who_key = "verifiableCredentials_"+Buffer.from(dataMerkleRoot.accountHash()).toString('hex')+"_statusChanges_"+index+"_who";
    
    

    // Step 5: Query node for value by key.
    try{
        let issuer = await clientRpc.getBlockState(stateRootHash,contractHash,[issuer_key]);
        console.log("issuer:");
        console.log(issuer);
    }catch{
        console.log("issuer doesnt instantiated");
    }
    try{
        let dataMerkleRoot = await clientRpc.getBlockState(stateRootHash,contractHash,[dataMerkleRoot_key]);
        console.log("dataMerkleRoot:");
        console.log(dataMerkleRoot);
    }catch{
        console.log("dataMerkleRoot doesnt instantiated");
    }
    try{
        let dateIssued = await clientRpc.getBlockState(stateRootHash,contractHash,[dateIssued_key]);
        console.log("dateIssued:");
        console.log(dateIssued);
    }catch{
        console.log("dateIssued doesnt instantiated");
    }
    try{
        let status = await clientRpc.getBlockState(stateRootHash,contractHash,[status_key]);
        console.log("status:");
        console.log(status);
    }catch{
        console.log("status doesnt instantiated");
    }
    try{ 
        let isRevokable = await clientRpc.getBlockState(stateRootHash,contractHash,[isRevokable_key]);
        console.log("isRevokable:");
        console.log(isRevokable);
    }catch{
        console.log("isRevokable doesnt instantiated");
    }
    try{
        let statusChanges_length = await clientRpc.getBlockState(stateRootHash,contractHash,[statusChanges_length_key]);
        console.log("statusChanges_length:");
        console.log(statusChanges_length);
    }catch{
        console.log("statusChanges_length doesnt instantiated");
    }
    try{
        let statusChanges_oldStatus = await clientRpc.getBlockState(stateRootHash,contractHash,[statusChanges_oldStatus_key]);
        console.log("statusChanges_oldStatus:");
        console.log(statusChanges_oldStatus);
    }catch{
        console.log("statusChanges_oldStatus doesnt instantiated");
    }
    try{
        let statusChanges_newStatus = await clientRpc.getBlockState(stateRootHash,contractHash,[statusChanges_newStatus_key]);
        console.log("statusChanges_newStatus:");
        console.log(statusChanges_newStatus);
    }catch{
        console.log("statusChanges_newStatus doesnt instantiated");
    }
    try{
        let statusChanges_dateChanged = await clientRpc.getBlockState(stateRootHash,contractHash,[statusChanges_dateChanged_key]);
        console.log("statusChanges_dateChanged:");
        console.log(statusChanges_dateChanged);
    }catch{
        console.log("statusChanges_dateChanged doesnt instantiated");
    }
    try{
        let statusChanges_who = await clientRpc.getBlockState(stateRootHash,contractHash,[statusChanges_who_key]);
        console.log("statusChanges_who:");
        console.log(statusChanges_who);
    }catch{
        console.log("statusChanges_who doesnt instantiated");
    }
    
}

const main = async () => {
    const ippolit = Keys.Ed25519.parseKeyFiles(
        './network_keys/ippolit/IppolitWallet_public_key.pem',
        './network_keys/ippolit/IppolitWallet_secret_key.pem'
    );
    let bob = Keys.Ed25519.parseKeyFiles(
        './network_keys/user1/public_key.pem',
        './network_keys/user1/secret_key.pem'
    );
    let dataMerkleRoot = ippolit;
    let index = 0;
    await readVerifiableCredentials(dataMerkleRoot,index);
   
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
 