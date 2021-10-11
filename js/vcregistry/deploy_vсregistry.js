
var _ = require('lodash');
const fs = require('fs');
const caspersdk = require('casper-js-sdk');
const CasperClient = caspersdk.CasperClient;
const CasperServiceByJsonRPC = caspersdk.CasperServiceByJsonRPC;
const CLValueBuilder = caspersdk.CLValueBuilder;
const DeployUtil = caspersdk.DeployUtil;
const RuntimeArgs = caspersdk.RuntimeArgs;
const Keys = caspersdk.Keys;


// Path to contract to be installed.
const PATH_TO_CONTRACT = './target/wasm32-unknown-unknown/release/vcregistry.wasm';
const { CONTRACT_VCREGISTRY_NAME, 
        DEPLOY_NODE_ADDRESS,
        DEPLOY_CHAIN_NAME,
        DEPLOYMENT_KEY_PUBLIC_PATH,
        DEPLOYMENT_KEY_SECRET_PATH } = require("../constants");
const { sleep } = require('sleep');
const DEPLOY_GAS_PRICE = 5;
const DEPLOY_GAS_PAYMENT = 500000000000/2; //10000000000 = 10**10 ?= 1 CSPR ?
const DEPLOY_TTL_MS = 3600000;

const main = async () => {
    // Step 1: Set casper node client.
    const client = new CasperClient(DEPLOY_NODE_ADDRESS);
    const clientRpc = new CasperServiceByJsonRPC(DEPLOY_NODE_ADDRESS);

    // Step 2: Set contract operator key pair.
    const keyPairOfContract = Keys.Ed25519.parseKeyFiles(
        DEPLOYMENT_KEY_PUBLIC_PATH,
        DEPLOYMENT_KEY_SECRET_PATH
    );

    // Step 3.0: get binary of contract.
    const contractBinary = new Uint8Array(fs.readFileSync(PATH_TO_CONTRACT, null).buffer);

    // Step 3: Set contract installation deploy (unsigned).
    let deploy = DeployUtil.makeDeploy(
        new DeployUtil.DeployParams(
            keyPairOfContract.publicKey,
            DEPLOY_CHAIN_NAME,
            DEPLOY_GAS_PRICE,
            DEPLOY_TTL_MS
        ),
        DeployUtil.ExecutableDeployItem.newModuleBytes(
            contractBinary,
            RuntimeArgs.fromMap({
                // token_decimals: CLValueBuilder.u8(TOKEN_DECIMALS),
                // token_name: CLValueBuilder.string(TOKEN_NAME),
                // token_symbol: CLValueBuilder.string(TOKEN_SYMBOL),
                // token_total_supply: CLValueBuilder.u256(TOKEN_SUPPLY),
            })
        ),
        DeployUtil.standardPayment(DEPLOY_GAS_PAYMENT)
    );

    // Step 4: Sign deploy.
    deploy = client.signDeploy(deploy, keyPairOfContract); 

    // Step 5: Dispatch deploy to node.
    const deployHash = await client.putDeploy(deploy);
    console.log("Deploy hash:");
    console.log(deployHash);

    console.log("Sleeping for 5 min. waiting for deploy tx to be included into the block...");
    sleep(300);

    const stateRootHash = await clientRpc.getStateRootHash();

    // Step 6: Query node for contract hash.
    const contractHash = await getAccountNamedKeyValue(client, stateRootHash, keyPairOfContract, CONTRACT_VCREGISTRY_NAME);
    console.log("Contract Hash = ", contractHash);

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
