#![no_main]
#![allow(unused_imports)]
#![allow(unused_parens)]
#![allow(dead_code)]
#![allow(non_snake_case)]

extern crate alloc;

use alloc::{
    collections::{BTreeMap, BTreeSet},
    string::String,
};
use core::convert::TryInto;
use std::{io::{Read, SeekFrom}, thread::AccessError, vec};

use contract::{contract_api::{runtime::{self, revert}, storage, system::get_auction}, unwrap_or_revert::UnwrapOrRevert};

use types::{ApiError, BlockTime, CLType, CLTyped, CLValue, Group, Parameter, RuntimeArgs, U256, U512, URef, 
            account::{AccountHash, AccountHashBytes}, bytesrepr::{FromBytes, ToBytes, Error}, 
            contracts::{EntryPoint, EntryPointAccess, EntryPointType, EntryPoints, NamedKeys}, 
            runtime_args};


#[derive(PartialEq)]
pub enum VCStatus{  
    NotExists = 0,
    Active = 1,
    Revoked = 2 
}

impl CLTyped for VCStatus {
    fn cl_type() -> CLType{
        CLType::U8
    }
}

impl ToBytes for VCStatus {
    fn to_bytes(&self) -> Result<Vec<u8>, Error> {
        match *self {
            VCStatus::NotExists => 0u8.to_bytes(),
            VCStatus::Active => 1u8.to_bytes(),
            VCStatus::Revoked => 2u8.to_bytes(),
        }
    }
    fn serialized_length(&self) -> usize {
        1usize
    }
}

impl FromBytes for VCStatus {
    fn from_bytes(bytes: &[u8]) -> Result<(Self, &[u8]), Error>{
        match bytes {
            [0u8] => Ok((VCStatus::NotExists,&[0u8])),
            [1u8] => Ok((VCStatus::Active,&[1u8])),
            [2u8] => Ok((VCStatus::Revoked,&[2u8])),
            _ => Err(Error::LeftOverBytes),
        }
    }
}

impl Default for VCStatus {
    fn default() -> Self { 
        VCStatus::NotExists
    }
}


#[no_mangle]
pub extern "C" fn issueVC(){
    let dataMerkleRoot: AccountHash = runtime::get_named_arg("_dataMerkleRoot");
    let _isRevokable: bool = runtime::get_named_arg("_isRevokable");
    let status: VCStatus = get_key(&verifiableCredentials_status_key(&dataMerkleRoot));
    if status != VCStatus::NotExists {
        runtime::revert(ApiError::InvalidArgument);
    }
    let msgSender: AccountHash = runtime::get_caller();
    set_key(&verifiableCredentials_issuer_key(&dataMerkleRoot), msgSender);
    set_key(&verifiableCredentials_dataMerkleRoot_key(&dataMerkleRoot), dataMerkleRoot);
    let now_blocktime: BlockTime = runtime::get_blocktime();
    let now: u64 = now_blocktime.into();
    set_key(&verifiableCredentials_dateIssued_key(&dataMerkleRoot), now);
    set_key(&verifiableCredentials_status_key(&dataMerkleRoot), VCStatus::Active);
    set_key(&verifiableCredentials_isRevokable_key(&dataMerkleRoot), _isRevokable);
    let length: u64 = 0u64;
    set_key(&verifiableCredentials_statusChanges_length_key(&dataMerkleRoot), length);

    // let result:CLValue = CLValue::from_t(true).unwrap();
    // ret(result);
}   

#[no_mangle]
pub extern "C" fn revokeVC(){
    let dataMerkleRoot: AccountHash = runtime::get_named_arg("_dataMerkleRoot");
    let isRevokable: bool = get_key(&verifiableCredentials_isRevokable_key(&dataMerkleRoot));
    if !isRevokable {
        runtime::revert(ApiError::Unhandled);
    }
    let issuer: AccountHash = get_key(&verifiableCredentials_issuer_key(&dataMerkleRoot));
    let msgSender: AccountHash = runtime::get_caller(); 
    if issuer != msgSender {
        runtime::revert(ApiError::PermissionDenied);
    }
    let status: u8 = get_key(&verifiableCredentials_status_key(&dataMerkleRoot));
    if status != VCStatus::to_bytes(&VCStatus::Active).unwrap()[0] {
        runtime::revert(ApiError::Deserialize);
    }
    set_key(&verifiableCredentials_status_key(&dataMerkleRoot),VCStatus::Revoked);
    let length:u64 = get_key(&verifiableCredentials_statusChanges_length_key(&dataMerkleRoot)); 
    let index = length;
    set_key(&verifiableCredentials_statusChanges_oldStatus_key(&dataMerkleRoot,index),VCStatus::Active);
    set_key(&verifiableCredentials_statusChanges_newStatus_key(&dataMerkleRoot,index), VCStatus::Revoked);
    let now_blocktime: BlockTime = runtime::get_blocktime();
    let now: u64 = now_blocktime.into();
    set_key(&verifiableCredentials_statusChanges_dateChanged_key(&dataMerkleRoot,index), now);
    set_key(&verifiableCredentials_statusChanges_who_key(&dataMerkleRoot,index), msgSender);
    set_key(&verifiableCredentials_statusChanges_length_key(&dataMerkleRoot), length+1);
}

#[no_mangle]
pub extern "C" fn reActivateVC(){
    let dataMerkleRoot: AccountHash = runtime::get_named_arg("_dataMerkleRoot");
    let msgSender: AccountHash = runtime::get_caller();
    let issuer: AccountHash = get_key(&verifiableCredentials_issuer_key(&dataMerkleRoot));
    if issuer != msgSender {
        runtime::revert(ApiError::PermissionDenied);
    }
    let status: u8 = get_key(&verifiableCredentials_status_key(&dataMerkleRoot));
    if status != VCStatus::to_bytes(&VCStatus::Revoked).unwrap()[0] {
        runtime::revert(    ApiError::None);
    }

    set_key(&verifiableCredentials_status_key(&dataMerkleRoot), VCStatus::Active);
    let length:u64 = get_key(&verifiableCredentials_statusChanges_length_key(&dataMerkleRoot)); 
    let index = length;
    set_key(&verifiableCredentials_statusChanges_oldStatus_key(&dataMerkleRoot,index),VCStatus::Revoked);
    set_key(&verifiableCredentials_statusChanges_newStatus_key(&dataMerkleRoot,index), VCStatus::Active);
    let now_blocktime: BlockTime = runtime::get_blocktime();
    let now: u64 = now_blocktime.into();
    set_key(&verifiableCredentials_statusChanges_dateChanged_key(&dataMerkleRoot,index), now);
    set_key(&verifiableCredentials_statusChanges_who_key(&dataMerkleRoot,index), msgSender);
    set_key(&verifiableCredentials_statusChanges_length_key(&dataMerkleRoot), length+1);
    // let result: bool = true;
    // ret(result);
}

#[no_mangle]
pub extern "C" fn call() {
    let mut entry_points = EntryPoints::new();
    entry_points.add_entry_point(endpoint(
        "issueVC",
        vec![
            Parameter::new("_dataMerkleRoot",AccountHash::cl_type()),
            Parameter::new("_isRevokable",CLType::Bool),
        ],
        CLType::Bool,
    ));
    entry_points.add_entry_point(endpoint(
        "revokeVC",
        vec![
            Parameter::new("_dataMerkleRoot",AccountHash::cl_type()),
        ],
        CLType::Bool,

    ));
    entry_points.add_entry_point(endpoint(
        "reActivateVC",
        vec![
            Parameter::new("_dataMerkleRoot",AccountHash::cl_type()),
        ],
        CLType::Bool,
    ));
    
    //let mut named_keys = NamedKeys::new();
    
    let contract_name: &str = "CasperVCRegistry5";
    let contract_hash_name: &str = &format!("{}_{}",contract_name,"hash");

    let (contract_hash, _) = storage::new_locked_contract(entry_points, None, None, None);
    runtime::put_key(contract_name, contract_hash.into());
    runtime::put_key(contract_hash_name, storage::new_uref(contract_hash).into());
}

fn verifiableCredentials_issuer_key(dataMerkleRoot: &AccountHash) -> String{
    format!("verifiableCredentials_{}_issuer", &dataMerkleRoot)
}

fn verifiableCredentials_dataMerkleRoot_key(dataMerkleRoot: &AccountHash) -> String{
    format!("verifiableCredentials_{}_dataMerkleRoot", &dataMerkleRoot)
}

fn verifiableCredentials_dateIssued_key(dataMerkleRoot: &AccountHash) -> String{
    format!("verifiableCredentials_{}_dateIssued", &dataMerkleRoot)
}

fn verifiableCredentials_status_key(dataMerkleRoot: &AccountHash) -> String{
    format!("verifiableCredentials_{}_status", &dataMerkleRoot)
}

fn verifiableCredentials_isRevokable_key(dataMerkleRoot: &AccountHash) -> String{
    format!("verifiableCredentials_{}_isRevokable", &dataMerkleRoot)
}

fn verifiableCredentials_statusChanges_length_key(dataMerkleRoot: &AccountHash) -> String{
    format!("verifiableCredentials_{}_statusChanges_length", &dataMerkleRoot)
}

fn verifiableCredentials_statusChanges_oldStatus_key(dataMerkleRoot: &AccountHash, index: u64) -> String{
    format!("verifiableCredentials_{}_statusChanges_{}_oldStatus", &dataMerkleRoot, index)
}

fn verifiableCredentials_statusChanges_newStatus_key(dataMerkleRoot: &AccountHash, index: u64) -> String{
    format!("verifiableCredentials_{}_statusChanges_{}_newStatus", &dataMerkleRoot, index)
}

fn verifiableCredentials_statusChanges_dateChanged_key(dataMerkleRoot: &AccountHash, index: u64) -> String{
    format!("verifiableCredentials_{}_statusChanges_{}_dateChanged", &dataMerkleRoot, index)
}

fn verifiableCredentials_statusChanges_who_key(dataMerkleRoot: &AccountHash, index: u64) -> String{
    format!("verifiableCredentials_{}_statusChanges_{}_who", &dataMerkleRoot, index)
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