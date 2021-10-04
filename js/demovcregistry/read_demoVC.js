/**
 * @fileOverview CSPR JS SDK demo: VCRegistry - view contract balances.
 */

var _ = require('lodash');

const caspersdk = require('casper-js-sdk');
const { identity } = require('lodash');
const Keys = caspersdk.Keys;
const CasperClient = caspersdk.CasperClient;
const CasperServiceByJsonRPC = caspersdk.CasperServiceByJsonRPC;

const { CONTRACT_DEMOVCREGISTRY_NAME, 
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
    const contractHash = await getAccountNamedKeyValue(client, stateRootHash, keyPairOfContract, CONTRACT_DEMOVCREGISTRY_NAME);

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
        console.log("verifiable_credentials issuer:");
        console.log(issuer);
    }catch{
        console.log("verifiable_credentials issuer doesnt instantiated");
    }
    try{
        let dataMerkleRoot = await clientRpc.getBlockState(stateRootHash,contractHash,[dataMerkleRoot_key]);
        console.log("verifiable_credentials dataMerkleRoot:");
        console.log(dataMerkleRoot);
    }catch{
        console.log("verifiable_credentials dataMerkleRoot doesnt instantiated");
    }
    try{
        let dateIssued = await clientRpc.getBlockState(stateRootHash,contractHash,[dateIssued_key]);
        console.log("verifiable_credentials issuer dateIssued:");
        console.log(dateIssued);
    }catch{
        console.log("verifiable_credentials issuer dateIssued doesnt instantiated");
    }
    try{
        let status = await clientRpc.getBlockState(stateRootHash,contractHash,[status_key]);
        console.log("verifiable_credentials issuer status:");
        console.log(status);
    }catch{
        console.log("verifiable_credentials issuer status doesnt instantiated");
    }
    try{ 
        let isRevokable = await clientRpc.getBlockState(stateRootHash,contractHash,[isRevokable_key]);
        console.log("verifiable_credentials issuer isRevokable:");
        console.log(isRevokable);
    }catch{
        console.log("verifiable_credentials issuer isRevokable doesnt instantiated");
    }
    try{
        let statusChanges_length = await clientRpc.getBlockState(stateRootHash,contractHash,[statusChanges_length_key]);
        console.log("verifiable_credentials issuer statusChanges_length:");
        console.log(statusChanges_length);
    }catch{
        console.log("verifiable_credentials issuer statusChanges_length doesnt instantiated");
    }
    try{
        let statusChanges_oldStatus = await clientRpc.getBlockState(stateRootHash,contractHash,[statusChanges_oldStatus_key]);
        console.log("verifiable_credentials issuer statusChanges_oldStatus:");
        console.log(statusChanges_oldStatus);
    }catch{
        console.log("verifiable_credentials issuer statusChanges_oldStatus doesnt instantiated");
    }
    try{
        let statusChanges_newStatus = await clientRpc.getBlockState(stateRootHash,contractHash,[statusChanges_newStatus_key]);
        console.log("verifiable_credentials issuer statusChanges_newStatus:");
        console.log(statusChanges_newStatus);
    }catch{
        console.log("verifiable_credentials issuer statusChanges_newStatus doesnt instantiated");
    }
    try{
        let statusChanges_dateChanged = await clientRpc.getBlockState(stateRootHash,contractHash,[statusChanges_dateChanged_key]);
        console.log("verifiable_credentials issuer statusChanges_dateChanged:");
        console.log(statusChanges_dateChanged);
    }catch{
        console.log("verifiable_credentials issuer statusChanges_dateChanged doesnt instantiated");
    }
    try{
        let statusChanges_who = await clientRpc.getBlockState(stateRootHash,contractHash,[statusChanges_who_key]);
        console.log("verifiable_credentials issuer statusChanges_who:");
        console.log(statusChanges_who);
    }catch{
        console.log("verifiable_credentials issuer statusChanges_who doesnt instantiated");
    }
    
}

const readRegistryOwner = async()=>{
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
    const contractHash = await getAccountNamedKeyValue(client, stateRootHash, keyPairOfContract, CONTRACT_DEMOVCREGISTRY_NAME);

    let registryOwner_key = "registryOwner";

    try{
        let registryOwner = await clientRpc.getBlockState(stateRootHash,contractHash,[registryOwner_key]);
        console.log("registryOwner:");
        console.log(registryOwner);
    }catch{
        console.log("registryOwner doesnt instantiated");
    }
}

const readDemoVCRegistry = async(dataMerkleRoot) =>{
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
    const contractHash = await getAccountNamedKeyValue(client, stateRootHash, keyPairOfContract, CONTRACT_DEMOVCREGISTRY_NAME);

    let demoVCRegistry_holder_key = "demoVCRegistry_"+Buffer.from(dataMerkleRoot.accountHash()).toString('hex')+"_holder";
    let demoVCRegistry_ipfsHash_key = "demoVCRegistry_"+Buffer.from(dataMerkleRoot.accountHash()).toString('hex')+"_ipfsHash";
    let demoVCRegistry_schemaHash_key = "demoVCRegistry_"+Buffer.from(dataMerkleRoot.accountHash()).toString('hex')+"_schemaHash";

    try{
        let demoVCRegistry_holder = await clientRpc.getBlockState(stateRootHash,contractHash,[demoVCRegistry_holder_key]);
        console.log("demoVCRegistry_holder:");
        console.log(demoVCRegistry_holder);
    }catch{
        console.log("demoVCRegistry_holder doesnt instantiated");
    }
    try{
        let demoVCRegistry_ipfsHash = await clientRpc.getBlockState(stateRootHash,contractHash,[demoVCRegistry_ipfsHash_key]);
        console.log("demoVCRegistry_ipfsHash:");
        console.log(demoVCRegistry_ipfsHash);
    }catch{
        console.log("demoVCRegistry_ipfsHash doesnt instantiated");
    }
    try{
        let demoVCRegistry_schemaHash = await clientRpc.getBlockState(stateRootHash,contractHash,[demoVCRegistry_schemaHash_key]);
        console.log("demoVCRegistry_schemaHash:");
        console.log(demoVCRegistry_schemaHash);
    }catch{
        console.log("demoVCRegistry_schemaHash doesnt instantiated");
    }

}

const readIssuedVCs = async(issuer,index) =>{
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
     const contractHash = await getAccountNamedKeyValue(client, stateRootHash, keyPairOfContract, CONTRACT_DEMOVCREGISTRY_NAME);
 
     let issuedVCs_length_key = "issuedVCs_"+Buffer.from(issuer.accountHash()).toString('hex')+"_length";
     let issuedVCs_key = "issuedVCs_"+Buffer.from(issuer.accountHash()).toString('hex')+"_"+index;
 
    try{
        let issuedVCs_length = await clientRpc.getBlockState(stateRootHash,contractHash,[issuedVCs_length_key]);
        console.log("issuedVCs_length:");
        console.log(issuedVCs_length);
    }catch{
        console.log("issuedVCs_length doesnt instantiated");
    }
    try{
        let issuedVCs = await clientRpc.getBlockState(stateRootHash,contractHash,[issuedVCs_key]);
        console.log("issuedVCs:");
        console.log(issuedVCs);
    }catch{
        console.log("issuedVCs_key doesnt instantiated");
    }
     
}

const holderVCs = async(issuer,index) =>{
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
    const contractHash = await getAccountNamedKeyValue(client, stateRootHash, keyPairOfContract, CONTRACT_DEMOVCREGISTRY_NAME);

    let holderVCs_length_key = "holderVCs_"+Buffer.from(issuer.accountHash()).toString('hex')+"_length";
    let holderVCs_key = "holderVCs_"+Buffer.from(issuer.accountHash()).toString('hex')+"_"+index;

    try{
        let holderVCs_length = await clientRpc.getBlockState(stateRootHash,contractHash,[holderVCs_length_key]);
        console.log("holderVCs_length:");
        console.log(holderVCs_length);
    }catch{
        console.log("holderVCs_length doesnt instantiated");
    }
    try{
        let holderVCs = await clientRpc.getBlockState(stateRootHash,contractHash,[holderVCs_key]);
        console.log("holderVCs:");
        console.log(holderVCs);
    }catch{
        console.log("holderVCs doesnt instantiated");
    }
}

const supportedSchemas = async(schema) =>{
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
    const contractHash = await getAccountNamedKeyValue(client, stateRootHash, keyPairOfContract, CONTRACT_DEMOVCREGISTRY_NAME);

    let supportedSchemas_key = "supportedSchemas_"+Buffer.from(schema.accountHash()).toString('hex');

    try{
        let supportedSchemas = await clientRpc.getBlockState(stateRootHash,contractHash,[supportedSchemas_key]);
        console.log("supportedSchemas:");
        console.log(supportedSchemas);
    }catch{
        console.log("supportedSchemas doesnt instantiated");
    }
   
}

const readRerequestCounter = async()=>{
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
    const contractHash = await getAccountNamedKeyValue(client, stateRootHash, keyPairOfContract, CONTRACT_DEMOVCREGISTRY_NAME);

    let requestCounter_key = "requestCounter";

    try{
        let requestCounter = await clientRpc.getBlockState(stateRootHash,contractHash,[requestCounter_key]);
        console.log("requestCounter:");
        console.log(requestCounter);
    }catch{
        console.log("requestCounter doesnt instantiated");
    }
}

const readVpRequest = async(requestIndex)=>{
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
    const contractHash = await getAccountNamedKeyValue(client, stateRootHash, keyPairOfContract, CONTRACT_DEMOVCREGISTRY_NAME);

    let vpRequests_schemaHash_key = "vpRequests_"+requestIndex+"_schemaHash";
    let vpRequests_requestedSchemaFields_key = "vpRequests_"+requestIndex+"_requestedSchemaFields";
    let vpRequests_responseIPFSHash_key = "vpRequests_"+requestIndex+"_responseIPFSHash";
    let vpRequests_receiver_key = "vpRequests_"+requestIndex+"_receiver";

    try{
        let vpRequests_schemaHash = await clientRpc.getBlockState(stateRootHash,contractHash,[vpRequests_schemaHash_key]);
        console.log("vpRequests_schemaHash:");
        console.log(vpRequests_schemaHash);
    }catch{
        console.log("vpRequests_schemaHash doesnt instantiated");
    }
    try{
        let vpRequests_requestedSchemaFields = await clientRpc.getBlockState(stateRootHash,contractHash,[vpRequests_requestedSchemaFields_key]);
        console.log("vpRequests_requestedSchemaFields:");
        console.log(vpRequests_requestedSchemaFields);
    }catch{
        console.log("vpRequests_requestedSchemaFields doesnt instantiated");
    }
    try{
        let vpRequests_responseIPFSHash = await clientRpc.getBlockState(stateRootHash,contractHash,[vpRequests_responseIPFSHash_key]);
        console.log("vpRequests_responseIPFSHash:");
        console.log(vpRequests_responseIPFSHash);
    }catch{
        console.log("vpRequests_responseIPFSHash doesnt instantiated");
    }
    try{
        let vpRequests_receiver = await clientRpc.getBlockState(stateRootHash,contractHash,[vpRequests_receiver_key]);
        console.log("vpRequests_receiver:");
        console.log(vpRequests_receiver);
    }catch{
        console.log("vpRequests_receiver doesnt instantiated");
    }
}

const readRequestsSent = async(account, requestIndex) => {
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
    const contractHash = await getAccountNamedKeyValue(client, stateRootHash, keyPairOfContract, CONTRACT_DEMOVCREGISTRY_NAME);

    let requestsSent_length_key = "requestsSent_"+Buffer.from(account.accountHash()).toString('hex')+"_length";
    let requestsSent_key = "requestsSent_"+Buffer.from(account.accountHash()).toString('hex')+"_"+requestIndex;
    
    try{
        let requestsSent_length = await clientRpc.getBlockState(stateRootHash,contractHash,[requestsSent_length_key]);
        console.log("requestsSent_length:");
        console.log(requestsSent_length);
    }catch{
        console.log("requestsSent_length doesnt instantiated");
    }
    try{
        let requestsSent = await clientRpc.getBlockState(stateRootHash,contractHash,[requestsSent_key]);
        console.log("requestsSent:");
        console.log(requestsSent);
    }catch{
        console.log("requestsSent doesnt instantiated");
    }
}

const readRequestsReceived = async(account, requestIndex) => {
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
    const contractHash = await getAccountNamedKeyValue(client, stateRootHash, keyPairOfContract, CONTRACT_DEMOVCREGISTRY_NAME);

    let requestsReceived_length_key = "requestsReceived_"+Buffer.from(account.accountHash()).toString('hex')+"_length";
    let requestsReceived_key = "requestsReceived_"+Buffer.from(account.accountHash()).toString('hex')+"_"+requestIndex;
    
    try{
        let requestsReceived_length = await clientRpc.getBlockState(stateRootHash,contractHash,[requestsReceived_length_key]);
        console.log("requestsReceived_length:");
        console.log(requestsReceived_length);
    }catch{
        console.log("requestsReceived_length doesnt instantiated");
    }
    try{
        let requestsReceived = await clientRpc.getBlockState(stateRootHash,contractHash,[requestsReceived_key]);
        console.log("requestsReceived:");
        console.log(requestsReceived);
    }catch{
        console.log("requestsReceived doesnt instantiated");
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
    console.log("ippolit acc hash:");
    console.log(ippolit.accountHash());
    let dataMerkleRoot = ippolit;
    let index = 0;
    await readVerifiableCredentials(dataMerkleRoot,index);
    await readRegistryOwner();
    await readDemoVCRegistry(dataMerkleRoot);
    let issuer = ippolit;
    await readIssuedVCs(issuer,index);
    await holderVCs(issuer,index);
    let schema = ippolit;
    await supportedSchemas(schema);
    await readRerequestCounter();
    let requestIndex = 0;
    await readVpRequest(requestIndex);
    let account = ippolit;
    await readRequestsSent(account,requestIndex);
    await readRequestsReceived(account,requestIndex);
   
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
    //console.log(accountInfo)
     // Get value of contract v1 named key.
    let res = _.find(accountInfo.namedKeys, (i) => { return i.name === namedKey });
    return res.key;
 };
 
 main();
  