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
use std::{fmt::format, io::{Read, SeekFrom}, thread::AccessError, vec};

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

impl Default for VCStatus {
    fn default() -> Self { 
        VCStatus::NotExists
    }
}

enum DemoRegistryError{
    MsgSenderNotRegistryOwner = 0,
    StatusShouldBeNotExist = 1,
    SchemaNotSupported = 2,
    ReceiverIsNotMsgSender = 3,
    RegistryOwnerIsSet = 4,


}

impl From<DemoRegistryError> for ApiError {
    fn from(error: DemoRegistryError) -> Self {
        ApiError::User(error as u16)
    }
}

#[no_mangle]
pub extern "C" fn initialize(){
    let registryOwner: AccountHash = get_key(&registrOwner_key());
    let zeroAccount: AccountHash = AccountHash::new([0u8;32]);
    if registryOwner == zeroAccount {
        let msgSender: AccountHash = runtime::get_caller();
        set_key(&registrOwner_key(), msgSender);
    }
    else {
        revert(DemoRegistryError::RegistryOwnerIsSet);
    }
}

#[no_mangle]
pub extern "C" fn setSchema(){
    let schemaHash: AccountHash = runtime::get_named_arg("_schemaHash");
    let enabled: bool = runtime::get_named_arg("_enabled");
    let msgSender: AccountHash = runtime::get_caller();
    let registryOwner: AccountHash = get_key(&registrOwner_key());
    if msgSender != registryOwner {
        runtime::revert(DemoRegistryError::MsgSenderNotRegistryOwner);
    }
    set_key(&supportedSchemas_key(&schemaHash), enabled);
}


#[no_mangle]
pub extern "C" fn issueDemoVC(){
    let dataMerkleRoot: AccountHash = runtime::get_named_arg("_dataMerkleRoot");
    let isRevokable: bool = runtime::get_named_arg("_isRevokable");
    let holder: AccountHash = runtime::get_named_arg("_holder");
    let ipfsHash: AccountHash = runtime::get_named_arg("_ipfsHash");
    let schemaHash: AccountHash = runtime::get_named_arg("_schemaHash");
    let status: u8 = get_key(&verifiableCredentials_status_key(&dataMerkleRoot));
    if status != VCStatus::to_bytes(&VCStatus::NotExists).unwrap()[0] {
        runtime::revert(DemoRegistryError::StatusShouldBeNotExist);
    }
    let isSupported: bool = get_key(&supportedSchemas_key(&schemaHash));
    if !isSupported {
        runtime::revert(DemoRegistryError::SchemaNotSupported);
    }
    let msgSender: AccountHash = runtime::get_caller();
    set_key(&verifiableCredentials_issuer_key(&dataMerkleRoot), msgSender);
    set_key(&verifiableCredentials_dataMerkleRoot_key(&dataMerkleRoot), dataMerkleRoot);
    let now_blocktime: BlockTime = runtime::get_blocktime();
    let now: u64 = now_blocktime.into();
    set_key(&verifiableCredentials_dateIssued_key(&dataMerkleRoot), now);
    set_key(&verifiableCredentials_status_key(&dataMerkleRoot), VCStatus::Active);
    set_key(&verifiableCredentials_isRevokable_key(&dataMerkleRoot), isRevokable);
    let verifiableCredentials_statusChanges_length: u64 = 0u64;
    set_key(&verifiableCredentials_statusChanges_length_key(&dataMerkleRoot), verifiableCredentials_statusChanges_length);

    set_key(&demoVCRegistry_holder_key(&dataMerkleRoot), holder);
    set_key(&demoVCRegistry_ipfsHash_key(&dataMerkleRoot), ipfsHash);
    set_key(&demoVCRegistry_schemaHash_key(&dataMerkleRoot), schemaHash);

    let issuedVCs_length: u64 = 1;
    let index = issuedVCs_length - 1;
    set_key(&issuedVCs_length_key(&msgSender),issuedVCs_length);
    set_key(&issuedVCs_key(&msgSender,index), dataMerkleRoot);

    let holderVCs_length: u64 = 1;
    let index = holderVCs_length - 1;
    set_key(&holderVCs_length_key(&holder), holderVCs_length);
    set_key(&holderVCs_key(&holder,index), dataMerkleRoot);

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

}

#[no_mangle]
pub extern "C" fn sendVPRequest(){
    let schemaHash: AccountHash = runtime::get_named_arg("_schemaHash");
    let requestedFields: Vec<u32> = runtime::get_named_arg("_requestedFields");
    let to: AccountHash = runtime::get_named_arg("_to");
    let msgSender: AccountHash = runtime::get_caller();

    let requestCounter: u64 = get_key(&requestCounter_key());
    let nextCounterValue = requestCounter + 1;
    set_key(&requestCounter_key(), nextCounterValue);

    set_key(&vpRequests_schemaHash_key(nextCounterValue), schemaHash);
    set_key(&vpRequests_requestedSchemaFields_key(nextCounterValue), requestedFields);
    let responceIPFSHash: AccountHash = AccountHash::new([0u8;32]); 
    set_key(&vpRequests_responseIPFSHash_key(nextCounterValue),responceIPFSHash);
    set_key(&vpRequests_receiver_key(nextCounterValue), to);

    let requestsSent_length: u64 = get_key(&requestsSent_length_key( &msgSender));
    set_key(&requestsSent_key(&msgSender,requestsSent_length),nextCounterValue);
    let nextRequestsSent_length:u64 = requestsSent_length + 1;
    set_key(&requestsSent_length_key( &msgSender), nextRequestsSent_length);

    let requestsReceived_length: u64 = get_key(&requestsReceived_length_key(&to));
    set_key(&requestsReceived_key(&to,requestsReceived_length), nextCounterValue);
    let nextRequestsReceived_length: u64 = requestsReceived_length + 1;
    set_key(&requestsReceived_length_key(&to), nextRequestsReceived_length);

}

#[no_mangle]
pub extern "C" fn registerVPResponse(){
    let vpRequestID:u64 = runtime::get_named_arg("_vpRequestID");
    let ipfsHash:AccountHash = runtime::get_named_arg("_ipfsHash");

    let msgSender: AccountHash = runtime::get_caller();
    let receiver: AccountHash = get_key(&vpRequests_receiver_key(vpRequestID));
    if receiver != msgSender {
        revert(DemoRegistryError::ReceiverIsNotMsgSender);
    }
    set_key(&vpRequests_responseIPFSHash_key(vpRequestID), ipfsHash);
    
}

#[no_mangle]
pub extern "C" fn call() {
    
    let mut entry_points = EntryPoints::new();
    entry_points.add_entry_point(endpoint(
        "initialize",
        vec![],
        CLType::Unit,
    ));
    entry_points.add_entry_point(endpoint(
        "setSchema",
        vec![
            Parameter::new("_schemaHash", AccountHash::cl_type()),
            Parameter::new("_enabled",CLType::Bool),
        ],
        CLType::Unit,
    ));
    entry_points.add_entry_point(endpoint(
        "issueDemoVC",
        vec![
            Parameter::new("_dataMerkleRoot",AccountHash::cl_type()),
            Parameter::new("_isRevokable",CLType::Bool),
            Parameter::new("_holder",AccountHash::cl_type()),
            Parameter::new("_ipfsHash",AccountHash::cl_type()),
            Parameter::new("_schemaHash", AccountHash::cl_type())
        ],
        CLType::Unit,
    ));
    entry_points.add_entry_point(endpoint(
        "revokeVC",
        vec![
            Parameter::new("_dataMerkleRoot",AccountHash::cl_type()),
        ],
        CLType::Unit,
    ));
    entry_points.add_entry_point(endpoint(
        "reActivateVC",
        vec![
            Parameter::new("_dataMerkleRoot",AccountHash::cl_type()),
        ],
        CLType::Unit,
    ));
    entry_points.add_entry_point(endpoint(
        "sendVPRequest",
        vec![
            Parameter::new("_schemaHash", AccountHash::cl_type()),
            Parameter::new("_requestedFields",CLType::List(Box::new(CLType::U32))),
            Parameter::new("_to",AccountHash::cl_type()),
        ],
        CLType::Unit,
    ));
    entry_points.add_entry_point(endpoint(
        "registerVPResponse",
        vec![
            Parameter::new("_vpRequestID",CLType::U64),
            Parameter::new("_ipfsHash", AccountHash::cl_type()),
        ],
        CLType::Unit
    ));

    
    // let mut named_keys = NamedKeys::new();
    // named_keys.insert("registryOwner".to_string(), storage::new_uref(msgSender).into());

    let contract_name: &str = "CasperDemoVCRegistry11";
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

fn registrOwner_key() -> String{
    format!("registryOwner")
}

fn demoVCRegistry_holder_key(dataMerkleRoot: &AccountHash) -> String {
    format!("demoVCRegistry_{}_holder", &dataMerkleRoot)
}

fn demoVCRegistry_ipfsHash_key(dataMerkleRoot: &AccountHash) -> String {
    format!("demoVCRegistry_{}_ipfsHash", &dataMerkleRoot)
}

fn demoVCRegistry_schemaHash_key(dataMerkleRoot: &AccountHash) -> String {
    format!("demoVCRegistry_{}_schemaHash", &dataMerkleRoot)
}

fn issuedVCs_length_key(issuer: &AccountHash) -> String{
    format!("issuedVCs_{}_length", &issuer)
}

fn issuedVCs_key(issuer: &AccountHash, index: u64) -> String {
    format!("issuedVCs_{}_{}", &issuer, index)
}

fn holderVCs_length_key(holder: &AccountHash) -> String{
    format!("holderVCs_{}_length", &holder)
}

fn holderVCs_key(holder: &AccountHash, index: u64) -> String {
    format!("holderVCs_{}_{}", &holder, index)
}

fn supportedSchemas_key(schema: &AccountHash) -> String {
    format!("supportedSchemas_{}", &schema)
}

fn requestCounter_key() -> String{
    format!("requestCounter")
}

fn vpRequests_schemaHash_key(requestIndex: u64) -> String{
    format!("vpRequests_{}_schemaHash",requestIndex)
}

fn vpRequests_requestedSchemaFields_key(requestIndex: u64) -> String{
    format!("vpRequests_{}_requestedSchemaFields", requestIndex)
}

fn vpRequests_responseIPFSHash_key(requestIndex: u64) -> String{
    format!("vpRequests_{}_responseIPFSHash",requestIndex)
}

fn vpRequests_receiver_key(requestIndex: u64) -> String{
    format!("vpRequests_{}_receiver",requestIndex)
}

fn requestsSent_length_key(account: &AccountHash) -> String {
    format!("requestsSent_{}_length",account)
}

fn requestsSent_key(account: &AccountHash,requestIndex: u64) -> String {
    format!("requestsSent_{}_{}",account,requestIndex)
}

fn requestsReceived_length_key(account: &AccountHash) -> String {
    format!("requestsReceived_{}_length",account)
}

fn requestsReceived_key(account: &AccountHash,requestIndex: u64) -> String {
    format!("requestsReceived_{}_{}",account,requestIndex)
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