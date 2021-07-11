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
    
    let result = did.changeOwner(Sender(did.ali),did.ali,did.bob);
    println!("Result change owner: {:?}",result);
}

#[test]
fn test_did_identityOwner() {
    
    let mut did = Did::deployed();
    println!("Ali: {:?}",did.ali);
    println!("Bob: {:?}",did.bob);
    
    let result = did.identityOwner(Sender(did.ali),did.ali);//return function dont work! 
    println!("Result identity owner: {:?}",result);
}









