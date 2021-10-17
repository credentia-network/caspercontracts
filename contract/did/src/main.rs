#![no_main]
#![allow(unused_imports)]
#![allow(unused_parens)]
#![allow(dead_code)]
#![allow(non_snake_case)]
#[warn(non_snake_case)]

extern crate alloc;

use alloc::{
    collections::{BTreeMap, BTreeSet},
    string::String,
};
use core::convert::TryInto;
use std::{io::SeekFrom, thread::AccessError};

use contract::{contract_api::{runtime::{self, revert}, storage}, unwrap_or_revert::UnwrapOrRevert};

use types::{ApiError, BlockTime, CLType, CLTyped, CLValue, Group, Parameter, RuntimeArgs, U256, U512, URef, account::{AccountHash, AccountHashBytes}, bytesrepr::{FromBytes, ToBytes}, contracts::{EntryPoint, EntryPointAccess, EntryPointType, 
            EntryPoints, NamedKeys}, runtime_args};


// #[no_mangle]
// pub extern "C" fn asd(){
//     set_key("asd",runtime::get_caller());
// }

fn _identity_owner(identity: AccountHash) -> AccountHash{ 
    let owner: AccountHash = get_key(&owner_key(&identity));
    let zero_account: AccountHash = AccountHash::new([0u8;32]);
    if owner == zero_account {
        identity
    }else{
        owner
    }
}

#[no_mangle]
pub extern "C" fn identityOwner() { 
    let identity:AccountHash = runtime::get_named_arg("identity");
    let owner: AccountHash = _identity_owner(identity);
    ret(owner);
}

#[no_mangle]
pub extern "C" fn changeOwner(){
    let identity: AccountHash =  runtime::get_named_arg("identity");
    let new_owner: AccountHash = runtime::get_named_arg("newOwner");
    if _identity_owner(identity) != runtime::get_caller(){
        runtime::revert(ApiError::PermissionDenied);
    }
    set_key(&owner_key(&identity),new_owner);
    
}

#[no_mangle]
pub extern "C" fn addDelegate(){
    let identity: AccountHash = runtime::get_named_arg("identity");
    let delegateKey: String =   runtime::get_named_arg("delegateKey"); 
    let delegateValue: String = runtime::get_named_arg("delegateValue");
    let expire: u64 =           runtime::get_named_arg("expire");
    if _identity_owner(identity) != runtime::get_caller(){
        runtime::revert(ApiError::PermissionDenied);
    }
    let now_blocktime: BlockTime = runtime::get_blocktime();
    let now: u64 = now_blocktime.into();
    if expire <= now {
        runtime::revert(ApiError::InvalidArgument);
    }
    let value:(String,String,u64) = (delegateKey, delegateValue, expire);
    let index: u64 = get_key(&delegate_length_key(&identity));
    let next_index:u64 = index+1;
    set_key(&delegate_key(&identity, index), value);
    set_key(&delegate_length_key(&identity), next_index);
}

#[no_mangle]
pub extern "C" fn revokeDelegate(){
    let identity: AccountHash = runtime::get_named_arg("identity");
    let index: u64 =            runtime::get_named_arg("index");
    if _identity_owner(identity) != runtime::get_caller(){
        runtime::revert(ApiError::PermissionDenied);
    }
    let mut value: (String,String, u64) = get_key(&delegate_key(&identity, index)); 
    let now_blocktime: BlockTime = runtime::get_blocktime();
    let now: u64 = now_blocktime.into();
    value.2 = now;
    set_key(&delegate_key(&identity, index), value);
}

#[no_mangle]
pub extern "C" fn setAttribute(){
    let identity: AccountHash =  runtime::get_named_arg("identity");
    let attributeKey: String =   runtime::get_named_arg("attributeKey"); 
    let attributeValue: String = runtime::get_named_arg("attributeValue");
    let expire: u64 =            runtime::get_named_arg("expire");
    if _identity_owner(identity) != runtime::get_caller(){
        runtime::revert(ApiError::PermissionDenied);
    }
    let now_blocktime: BlockTime = runtime::get_blocktime();
    let now: u64 = now_blocktime.into();
    if expire <= now {
        runtime::revert(ApiError::InvalidArgument);
    }

    let value: (String,String,u64) = (attributeKey,attributeValue,expire);
    let index: u64 = get_key(&attribute_length_key(&identity));
    let next_index: u64 = index+1;
    set_key(&attribute_key(&identity,index), value);
    set_key(&attribute_length_key(&identity), next_index);
}

#[no_mangle]
pub extern "C" fn revokeAttribute(){
    let identity: AccountHash = runtime::get_named_arg("identity");
    if _identity_owner(identity) != runtime::get_caller(){
        runtime::revert(ApiError::PermissionDenied);
    }
    let index: u64 = runtime::get_named_arg("index");
    let mut value: (String,String,u64) = get_key(&attribute_key(&identity, index)); 
    let now_blocktime: BlockTime = runtime::get_blocktime();
    let now: u64 = now_blocktime.into();
    value.2 = now;
    set_key(&attribute_key(&identity, index), value);
    
}

#[no_mangle]
pub extern "C" fn call() {
    let mut entry_points = EntryPoints::new();
    // entry_points.add_entry_point(endpoint(
    //     "asd",
    //     vec![],
    //     CLType::Unit,
    // ));

    entry_points.add_entry_point(endpoint(
        "identityOwner",
        vec![
            Parameter::new("identity", AccountHash::cl_type()),
        ],
        CLType::U512,
    ));
    entry_points.add_entry_point(endpoint(
        "changeOwner",
        vec![
            Parameter::new("identity", AccountHash::cl_type()),
            Parameter::new("newOwner", AccountHash::cl_type()),
        ],
        CLType::Unit,
    ));
    entry_points.add_entry_point(endpoint(
        "addDelegate",
        vec![
            Parameter::new("identity", AccountHash::cl_type()),
            Parameter::new("delegateKey", CLType::String),
            Parameter::new("delegateValue",  CLType::String),
            Parameter::new("expire", CLType::U64),
        ],
        CLType::Unit
    ));
    entry_points.add_entry_point(endpoint(
        "revokeDelegate",
        vec![
            Parameter::new("identity", AccountHash::cl_type()),
            Parameter::new("index", AccountHash::cl_type()),
        ],
        CLType::Unit,
    ));
    entry_points.add_entry_point(endpoint(
        "setAttribute",
        vec![
            Parameter::new("identity", AccountHash::cl_type()),
            Parameter::new("attributeKey", CLType::String),
            Parameter::new("attributeValue", CLType::String),
            Parameter::new("expire", CLType::U64),
        ],
        CLType::Unit
    ));
    entry_points.add_entry_point(endpoint(
        "revokeAttribute",
        vec![
            Parameter::new("identity", AccountHash::cl_type()),
            Parameter::new("index",CLType::U64),
        ],
        CLType::Unit
    ));
   
    //let mut named_keys = NamedKeys::new();
    
    let contract_name: &str = "CasperDIDRegistryV2";
    let contract_hash_name: &str = &format!("{}_{}",contract_name,"hash");

    let (contract_hash, _) = storage::new_locked_contract(entry_points, None, None, None);
    runtime::put_key(contract_name, contract_hash.into());
    runtime::put_key(contract_hash_name, storage::new_uref(contract_hash).into());
}

fn owner_key(identity: &AccountHash) -> String{
    //return string like this: "owner_4a313b4d53a7fa6bb9e924c1ad499bb083d236b2c58b5e9a64b563518b1dc407"
    format!("owner_{}", identity)
}

fn delegate_length_key(identity: &AccountHash) -> String {
    format!("{}_delegateLength",identity)
}

fn delegate_key(identity: &AccountHash, index: u64) -> String{
    //return string like this: "delegate_"
    format!("{}_delegate_{}",identity,index)
}

fn attribute_length_key(identity: &AccountHash,) -> String{
    format!("{}_attributeLength",identity)
}

fn attribute_key(identity: &AccountHash,index: u64) -> String{
    format!("{}_attribute_{}",identity, index)
}

fn get_key<T: FromBytes + CLTyped + Default>(name: &str) -> T {
    match runtime::get_key(name) {
        None => Default::default(),
        Some(value) => {
            let key = value.try_into().unwrap_or_revert();
            storage::read(key).unwrap_or_revert().unwrap_or_revert()
        }
    }
}

fn set_key<T: ToBytes + CLTyped>(name: &str, value: T) {
    match runtime::get_key(name) {
        Some(key) => {
            let key_ref = key.try_into().unwrap_or_revert();
            storage::write(key_ref, value);
        }
        None => {
            let key = storage::new_uref(value).into();
            runtime::put_key(name, key);
        }
    }
}

pub(crate) fn ret<T: CLTyped + ToBytes>(value: T) {
    runtime::ret(CLValue::from_t(value).unwrap_or_revert())
}

fn endpoint(name: &str, param: Vec<Parameter>, ret: CLType) -> EntryPoint {
    EntryPoint::new(
        String::from(name),
        param,
        ret,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    )
}