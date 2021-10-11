var _ = require('lodash');
const caspersdk = require("casper-js-sdk");
const CasperClient = caspersdk.CasperClient;
const CLValueBuilder = caspersdk.CLValueBuilder;
const DeployUtil = caspersdk.DeployUtil;
const Keys = caspersdk.Keys;
const RuntimeArgs = caspersdk.RuntimeArgs;
const CasperServiceByJsonRPC = caspersdk.CasperServiceByJsonRPC;


const { CONTRACT_DID_HASH, 
        DEPLOY_NODE_ADDRESS,
        DEPLOY_CHAIN_NAME,
        IPPOLIT_KEY_SECRET_PATH,
        IPPOLIT_KEY_PUBLIC_PATH,
        TRENT_KEY_SECRET_PATH,
        TRENT_KEY_PUBLIC_PATH,
        VICTOR_KEY_PUBLIC_PATH,
        VICTOR_KEY_SECRET_PATH
    } = require("../constants");
const DEPLOY_GAS_PRICE = 10;
const DEPLOY_GAS_PAYMENT = 50000000000;
const DEPLOY_TTL_MS = 3600000;



const setAttribute = async (_identity, _name, _value, _validity) => {
    setAttributeWithSigner(_identity,_identity,_name, _value, _validity);
    // // Step 1: Set casper node client.
    // const client = new CasperClient(DEPLOY_NODE_ADDRESS);

    // // Step 2: Set contract operator key pair.
    // const contractHashAsByteArray = [...Buffer.from(CONTRACT_DID_HASH.slice(5), "hex")];
    // // Step 5.0: Form input parametrs.
   
    // // Step 5.1: Form the deploy.
    // let deploy = DeployUtil.makeDeploy(
    //     new DeployUtil.DeployParams(
    //         _identity.publicKey,
    //         DEPLOY_CHAIN_NAME,
    //         DEPLOY_GAS_PRICE,
    //         DEPLOY_TTL_MS
    //     ),
    //     DeployUtil.ExecutableDeployItem.newStoredContractByHash(
    //         contractHashAsByteArray,
    //         "setAttribute",
    //         RuntimeArgs.fromMap({
    //             identity: CLValueBuilder.byteArray(_identity.accountHash()),
    //             name: CLValueBuilder.string(_name),
    //             value: CLValueBuilder.string(_value),
    //             validity: CLValueBuilder.u64(_validity),
    //         })
    //     ),
    //     DeployUtil.standardPayment(DEPLOY_GAS_PAYMENT)
    // );

    // // Step 5.2: Sign deploy.
    // deploy = client.signDeploy(deploy, _identity); 
    // console.log("signed deploy:");
    // console.log(deploy);

    // // Step 5.3: Dispatch deploy to node.
    // let deployResult = await client.putDeploy(deploy);
    // console.log("Deploy result");
    // console.log(deployResult);
};

const setAttributeWithSigner = async (signer,_identity, _name, _value, _validity) => {
    // Step 1: Set casper node client.
    const client = new CasperClient(DEPLOY_NODE_ADDRESS);

    // Step 2: Set contract operator key pair.
    const contractHashAsByteArray = [...Buffer.from(CONTRACT_DID_HASH.slice(5), "hex")];
    // Step 5.0: Form input parametrs.
   
    // Step 5.1: Form the deploy.
    let deploy = DeployUtil.makeDeploy(
        new DeployUtil.DeployParams(
            signer.publicKey,
            DEPLOY_CHAIN_NAME,
            DEPLOY_GAS_PRICE,
            DEPLOY_TTL_MS
        ),
        DeployUtil.ExecutableDeployItem.newStoredContractByHash(
            contractHashAsByteArray,
            "setAttribute",
            RuntimeArgs.fromMap({
                identity: CLValueBuilder.byteArray(_identity.accountHash()),
                name: CLValueBuilder.string(_name),
                value: CLValueBuilder.string(_value),
                validity: CLValueBuilder.u64(_validity),
            })
        ),
        DeployUtil.standardPayment(DEPLOY_GAS_PAYMENT)
    );

    // Step 5.2: Sign deploy.
    deploy = client.signDeploy(deploy, signer); 
    // console.log("signed deploy:");
    // console.log(deploy);

    // Step 5.3: Dispatch deploy to node.
    let deployResult = await client.putDeploy(deploy);
    console.log("Deploy result");
    console.log(deployResult);
};

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

    // let identity = victor;
    let name = "service-endpoint";
    let value = "https://myservice.com";
    let value2 = "https://myservice2.com";
    let validity = 1337;
    await setAttribute(victor,name,value,validity);
    await setAttribute(trent,name,value2,validity);
    // await setAttributeWithSigner(victor,identity,name,value2,validity);
    
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