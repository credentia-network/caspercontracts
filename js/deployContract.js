
const fs = require('fs');
const caspersdk = require('casper-js-sdk');
const CasperClient = caspersdk.CasperClient;
const CasperServiceByJsonRPC = caspersdk.CasperServiceByJsonRPC;
const CLValueBuilder = caspersdk.CLValueBuilder;
const DeployUtil = caspersdk.DeployUtil;
const RuntimeArgs = caspersdk.RuntimeArgs;
const Keys = caspersdk.Keys;


// Path to contract to be installed.
const PATH_TO_CONTRACT = './target/wasm32-unknown-unknown/release/contract.wasm';
const { CONTRACT_NAME, 
        DEPLOY_NODE_ADDRESS,
        DEPLOY_CHAIN_NAME } = require("./constants");
const DEPLOY_GAS_PRICE = 5;
const DEPLOY_GAS_PAYMENT = 500000000000; //10000000000 = 10**10 ?= 1 CSPR ?
const DEPLOY_TTL_MS = 3600000;

const main = async () => {
    // Step 1: Set casper node client.
    const client = new CasperClient(DEPLOY_NODE_ADDRESS);
    const clientRpc = new CasperServiceByJsonRPC(DEPLOY_NODE_ADDRESS);

    // Step 2: Set contract operator key pair.
    const keyPairOfContract = Keys.Ed25519.parseKeyFiles(
        './network_keys/ippolit/IppolitWallet_public_key.pem',
        './network_keys/ippolit/IppolitWallet_secret_key.pem'
    );

    // Step 3.0: get binary of contract.
    const contractBinary = new Uint8Array(fs.readFileSync(PATH_TO_CONTRACT, null).buffer);//getContractBinary();

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
};

main();
