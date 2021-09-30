var _ = require('lodash');
const caspersdk = require("casper-js-sdk");
const CasperClient = caspersdk.CasperClient;
const CLValueBuilder = caspersdk.CLValueBuilder;
const DeployUtil = caspersdk.DeployUtil;
const Keys = caspersdk.Keys;
const RuntimeArgs = caspersdk.RuntimeArgs;
const CasperServiceByJsonRPC = caspersdk.CasperServiceByJsonRPC;


const { CONTRACT_VCREGISTRY_NAME, 
        DEPLOY_NODE_ADDRESS,
        DEPLOY_CHAIN_NAME } = require("../constants");
const DEPLOY_GAS_PRICE = 10;
const DEPLOY_GAS_PAYMENT = 50000000000;
const DEPLOY_TTL_MS = 3600000;

const revokeVC = async (_dataMerkleRoot) => {
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
    const contractHashAsByteArray = [...Buffer.from(contractHash.slice(5), "hex")];

    // Step 5.0: Form input parametrs.

    // Step 5.1: Form the deploy.
    let deploy = DeployUtil.makeDeploy(
        new DeployUtil.DeployParams(
            keyPairOfContract.publicKey,
            DEPLOY_CHAIN_NAME,
            DEPLOY_GAS_PRICE,
            DEPLOY_TTL_MS
        ),
        DeployUtil.ExecutableDeployItem.newStoredContractByHash(
            contractHashAsByteArray,
            "revokeVC",
            RuntimeArgs.fromMap({
                _dataMerkleRoot: CLValueBuilder.byteArray(_dataMerkleRoot.accountHash()),
            })
        ),
        DeployUtil.standardPayment(DEPLOY_GAS_PAYMENT)
    );

    // Step 5.2: Sign deploy.
    deploy = client.signDeploy(deploy, keyPairOfContract); 
    console.log("signed deploy:");
    console.log(deploy);

    // Step 5.3: Dispatch deploy to node.
    let deployResult = await client.putDeploy(deploy);
    console.log("Deploy result");
    console.log(deployResult);
};


const main = async () => {
    const ippolit = Keys.Ed25519.parseKeyFiles(
        './network_keys/ippolit/IppolitWallet_public_key.pem',
        './network_keys/ippolit/IppolitWallet_secret_key.pem'
    );

    let bob = Keys.Ed25519.parseKeyFiles(
        './network_keys/user1/public_key.pem',
        './network_keys/user1/secret_key.pem'
    );

    
    await revokeVC(ippolit);
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