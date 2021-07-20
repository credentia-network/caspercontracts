#![allow(unused_imports)]
#![allow(unused_assignments)]
#![allow(dead_code)]

use casper_engine_test_support::{Code, Hash, SessionBuilder, TestContext, TestContextBuilder};
use casper_types::{
    account::AccountHash, bytesrepr::FromBytes, runtime_args, AsymmetricType, CLTyped, PublicKey,
    RuntimeArgs, U256, U512, CLType,
};
use crate::did::{did_cfg, Sender, Did};

#[test]
fn test_change_owner(){
    let mut did = Did::deployed();
    
    did.changeOwner(Sender(did.ali),did.ali,did.bob);

    let owner = did.identityOwner(did.ali);
    println!("Bob: {:?}", did.bob);
    println!("Result change owner: {:?}",owner);
    assert_eq!(did.bob, owner);
    
    
    let identity: AccountHash = did.ali;
    did.asd(Sender(did.ali), identity);
    let asd = did.call_asd();
    println!("Result asd: {:?}",asd);
}









