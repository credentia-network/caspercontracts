var _ = require('lodash');
const caspersdk = require("casper-js-sdk");
const CasperClient = caspersdk.CasperClient;
const CLValueBuilder = caspersdk.CLValueBuilder;
const DeployUtil = caspersdk.DeployUtil;
const Keys = caspersdk.Keys;
const RuntimeArgs = caspersdk.RuntimeArgs;
const CasperServiceByJsonRPC = caspersdk.CasperServiceByJsonRPC;


const { CONTRACT_DEMOVCREGISTRY_NAME, 
        DEPLOY_NODE_ADDRESS,
        DEPLOY_CHAIN_NAME } = require("../constants");
const DEPLOY_GAS_PRICE = 10;
const DEPLOY_GAS_PAYMENT = 50000000000;
const DEPLOY_TTL_MS = 3600000;

const setSchemaFromBob = async (_schemaHash, _enabled) => {
    // Step 1: Set casper node client.
    const client = new CasperClient(DEPLOY_NODE_ADDRESS);
    const clientRpc = new CasperServiceByJsonRPC(DEPLOY_NODE_ADDRESS);

    // Step 2: Set contract operator key pair.
    const keyPairOfSender = Keys.Ed25519.parseKeyFiles(
        './network_keys/user1/public_key.pem',
        './network_keys/user1/secret_key.pem'
    );

    // Step 3: Query node for global state root hash.
    const stateRootHash = await clientRpc.getStateRootHash();

    // Step 4: Query node for contract hash.
    const contractHash = 'hash-775d9463e264dd084bb93cebe63d623c7f9c3cd836569baf6c7e07bcf50c010d';
    const contractHashAsByteArray = [...Buffer.from(contractHash.slice(5), "hex")];

    // Step 5.0: Form input parametrs.

    // Step 5.1: Form the deploy.
    let deploy = DeployUtil.makeDeploy(
        new DeployUtil.DeployParams(
            keyPairOfSender.publicKey,
            DEPLOY_CHAIN_NAME,
            DEPLOY_GAS_PRICE,
            DEPLOY_TTL_MS
        ),
        DeployUtil.ExecutableDeployItem.newStoredContractByHash(
            contractHashAsByteArray,
            "setSchema",
            RuntimeArgs.fromMap({
                _schemaHash: CLValueBuilder.byteArray(_schemaHash.accountHash()),
                _enabled: CLValueBuilder.bool(_enabled),
            })
        ),
        DeployUtil.standardPayment(DEPLOY_GAS_PAYMENT)
    );

    // Step 5.2: Sign deploy.
    deploy = client.signDeploy(deploy, keyPairOfSender); 
    console.log("signed deploy:");
    console.log(deploy);

    // Step 5.3: Dispatch deploy to node.
    let deployResult = await client.putDeploy(deploy);
    console.log("Deploy result");
    console.log(deployResult);
};


const issueDemoVCFromBob = async (_dataMerkleRoot, _isRevokable, _holder, _ipfsHash, _schemaHash) => {
    // Step 1: Set casper node client.
    const client = new CasperClient(DEPLOY_NODE_ADDRESS);
    const clientRpc = new CasperServiceByJsonRPC(DEPLOY_NODE_ADDRESS);

    // Step 2: Set contract operator key pair.
     const keyPairOfSender = Keys.Ed25519.parseKeyFiles(
        './network_keys/user1/public_key.pem',
        './network_keys/user1/secret_key.pem'
    );
    console.log("public key:");
    console.log(keyPairOfSender.publicKey);

    // Step 3: Query node for global state root hash.
    const stateRootHash = await clientRpc.getStateRootHash();

    // Step 4: Query node for contract hash.
    const contractHash = 'hash-775d9463e264dd084bb93cebe63d623c7f9c3cd836569baf6c7e07bcf50c010d';//await getAccountNamedKeyValue(client, stateRootHash, keyPairOfContract, CONTRACT_DEMOVCREGISTRY_NAME);
    console.log("Contract Hash:");
    console.log(contractHash);
    
    const contractHashAsByteArray = [...Buffer.from(contractHash.slice(5), "hex")];
    console.log("contract hash as bytes array")
    console.log(contractHashAsByteArray);

    // Step 5.0: Form input parametrs.

    // Step 5.1: Form the deploy.
    let deploy = DeployUtil.makeDeploy(
        new DeployUtil.DeployParams(
            keyPairOfSender.publicKey,
            DEPLOY_CHAIN_NAME,
            DEPLOY_GAS_PRICE,
            DEPLOY_TTL_MS
        ),
        DeployUtil.ExecutableDeployItem.newStoredContractByHash(
            contractHashAsByteArray,
            "issueDemoVC",
            RuntimeArgs.fromMap({
                _dataMerkleRoot: CLValueBuilder.byteArray(_dataMerkleRoot.accountHash()),
                _isRevokable: CLValueBuilder.bool(_isRevokable),
                _holder: CLValueBuilder.byteArray(_holder.accountHash()),
                _ipfsHash: CLValueBuilder.byteArray(_ipfsHash.accountHash()),
                _schemaHash: CLValueBuilder.byteArray(_schemaHash.accountHash()),
            })
        ),
        DeployUtil.standardPayment(DEPLOY_GAS_PAYMENT)
    );

    // Step 5.2: Sign deploy.
    deploy = client.signDeploy(deploy, keyPairOfSender); 
    console.log("signed deploy:");
    console.log(deploy);

    // Step 5.3: Dispatch deploy to node.
    let deployResult = await client.putDeploy(deploy);
    console.log("Deploy result");
    console.log(deployResult);
};


const main = async () => {

    let bob = Keys.Ed25519.parseKeyFiles(
        './network_keys/user1/public_key.pem',
        './network_keys/user1/secret_key.pem'
    );

    let schemaHash = bob;
    let enabled = true;
    await setSchemaFromBob(schemaHash,enabled);

    // let dataMerkleRoot = bob;
    // let isRevoked = true; 
    // let holder = bob;
    // let ipfsHash = bob;
    // let schemaHash = bob;
    // await issueDemoVCFromBob(dataMerkleRoot,isRevoked,holder,ipfsHash,schemaHash);
};

const getAccountInfo = async (client, stateRootHash, keyPair) => {
    const accountHash = Buffer.from(keyPair.accountHash()).toString('hex');
    const { Account: accountInfo } = await client.nodeClient.getBlockState(
        stateRootHash,
        `account-hash-${accountHash}`,
        []
    );
    // console.log("account info:");
    // console.log(accountInfo);
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