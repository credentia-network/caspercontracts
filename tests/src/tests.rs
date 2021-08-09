#![allow(unused_imports)]
#![allow(unused_assignments)]
#![allow(dead_code)]
#![allow(non_snake_case)]

use casper_engine_test_support::{Code, Hash, SessionBuilder, TestContext, TestContextBuilder};
use casper_types::{
    account::AccountHash, bytesrepr::FromBytes, runtime_args, AsymmetricType, CLTyped, PublicKey,
    RuntimeArgs, U256, U512, CLType,
};
use crate::did::{did_cfg, Sender, Did};

use std::panic;

#[test]
fn test_1_change_owner(){
    let mut did = Did::deployed();

    let ownerBefore = did.identityOwner(did.ali);

    println!("Owner before: {:?}",ownerBefore);

    did.changeOwner(Sender(did.ali),did.ali,did.bob);

    let ownerAfter = did.identityOwner(did.ali);
    println!("Bob:         {:?}", did.bob);
    println!("Owner after: {:?}",ownerAfter);
    assert_eq!(did.bob, ownerAfter);
    
    let identity = did.ali;
    let delegate_type = AccountHash::new([0u8;32]);
    let delegate = did.bob;

    let validity: u64 = 228;

    // panic::set_hook(Box::new(|_info| {
    //     // do nothing
    // }));

    did.addDelegate(Sender(did.ali), identity, delegate_type, delegate, validity);
    
    
}
#[test]
fn test_2_add_delegate(){
    let mut did = Did::deployed();
    let identity = did.ali;
    let delegate_type = AccountHash::new([0u8;32]);
    let delegate = did.bob;
    let delegateBefore = did.getDelegate(identity, delegate_type, delegate);
    println!("Delegate before: {}",delegateBefore);

    let validity: u64 = 228;
    did.addDelegate(Sender(did.ali), identity, delegate_type, delegate, validity);
    

    let delegateAfter: u64 = did.getDelegate(identity, delegate_type, delegate);
    println!("Delegate after: {}",delegateAfter);
    assert_eq!(validity,delegateAfter);


    did.revokeDelegate(Sender(did.ali), identity, delegate_type, delegate, validity);
    
    let delegateRevoke = did.getDelegate(identity, delegate_type, delegate);
    let zero: u64 = 0u64;
    println!("Delegate revoke: {}",delegateRevoke);
    assert_eq!(zero, delegateRevoke);
}

#[test]
fn test_3_setAttribute(){
    let mut did = Did::deployed();
    let identity = did.ali;
    let name: &str = "attr";

    let attributeBefore:(String,u64) = did.getAttribute(identity, String::from(name));
    println!("Attribute before: {} , {}",attributeBefore.0,attributeBefore.1);

    let value = "Some valueable";
    let validity = 1337u64;
    did.setAttribute(Sender(did.ali), identity, String::from(name), String::from(value), validity);

    let attributeAfter:(String,u64) = did.getAttribute(identity, String::from(name));
    println!("Attribute before: {} , {}", attributeAfter.0, attributeAfter.1);
    assert_eq!(value, attributeAfter.0);
    assert_eq!(validity, attributeAfter.1);

    did.revokeAttribute(Sender(did.ali), identity, String::from(name));

    let attributeRevoke:(String,u64) = did.getAttribute(identity, String::from(name));
    println!("Attribute revoke: {} , {}", attributeRevoke.0, attributeRevoke.1);
    assert_eq!(value, &attributeRevoke.0);
    assert_eq!(0u64,attributeRevoke.1);
}