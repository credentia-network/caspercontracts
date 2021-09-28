#![no_main]
#![allow(unused_imports)]
#![allow(unused_parens)]
#![allow(dead_code)]
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


enum VCStatus {NotExists, Active, Revoked}


#[no_mangle]
pub extern "C" fn call() {
    let mut entry_points = EntryPoints::new();
    entry_points.add_entry_point(endpoint(
        "identityOwner",
        vec![
            Parameter::new("identity", AccountHash::cl_type()),
        ],
        CLType::U512,
    ));
    entry_points.add_entry_point(endpoint(
        "validDelegate",
        vec![
            Parameter::new("identity", AccountHash::cl_type()),
            Parameter::new("delegateType", AccountHash::cl_type()),
            Parameter::new("delegate", AccountHash::cl_type()),
        ],
        CLType::U64,
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
            Parameter::new("delegateType", AccountHash::cl_type()),
            Parameter::new("delegate", AccountHash::cl_type()),
            Parameter::new("validity", CLType::U64),
        ],
        CLType::Unit
    ));
    entry_points.add_entry_point(endpoint(
        "revokeDelegate",
        vec![
            Parameter::new("identity", AccountHash::cl_type()),
            Parameter::new("delegateType", AccountHash::cl_type()),
            Parameter::new("delegate", AccountHash::cl_type()),
        ],
        CLType::Unit,
    ));
    entry_points.add_entry_point(endpoint(
        "setAttribute",
        vec![
            Parameter::new("identity", AccountHash::cl_type()),
            Parameter::new("name", CLType::String),
            Parameter::new("value", CLType::String),
            Parameter::new("validity", CLType::U64),
        ],
        CLType::Unit
    ));
    entry_points.add_entry_point(endpoint(
        "revokeAttribute",
        vec![
            Parameter::new("identity", AccountHash::cl_type()),
            Parameter::new("name",CLType::String),
        ],
        CLType::Unit
    ));
   
    //let mut named_keys = NamedKeys::new();
    
    let contract_name: &str = "CasperDIDRegistry9";
    let contract_hash_name: &str = &format!("{}_{}",contract_name,"hash");

    let (contract_hash, _) = storage::new_locked_contract(entry_points, None, None, None);
    runtime::put_key(contract_name, contract_hash.into());
    runtime::put_key(contract_hash_name, storage::new_uref(contract_hash).into());
}

fn owner_key(identity: &AccountHash) -> String{
    //return string like this: "owner_4a313b4d53a7fa6bb9e924c1ad499bb083d236b2c58b5e9a64b563518b1dc407"
    format!("owner_{}", identity)
}

fn delegate_key(identity: &AccountHash, delegate_type: &AccountHash, delegate: &AccountHash) -> String{
    //return string like this: "delegate_"
    format!("delegate_{}_{}_{}", identity,delegate_type,delegate)
}

fn changed_key(identity: &AccountHash) -> String{
    format!("changed_{}",&identity)
}

fn attribute_key(identity: &AccountHash,name: &str) -> String{
    format!("attribute_{}_{}",identity,name)
}

fn _identity_owner(identity: AccountHash) -> AccountHash{ 
    let owner: AccountHash = get_key(&owner_key(&identity));
    let zero_account: AccountHash = AccountHash::new([0u8;32]);
    if owner == zero_account {
        identity
    }else{
        owner
    }
}

fn only_owner(identity: AccountHash, actor: AccountHash){
    if actor != _identity_owner(identity) {
        runtime::revert(ApiError::PermissionDenied);
    }
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