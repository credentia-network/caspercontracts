#![allow(unused_variables)]
#![allow(unused_imports)]
#![allow(non_snake_case)]

use std::panic::UnwindSafe;

use casper_engine_test_support::{Code, Hash, SessionBuilder, TestContext, TestContextBuilder};
use casper_types::{
    account::AccountHash, bytesrepr::FromBytes, runtime_args, AsymmetricType, CLTyped, PublicKey,
    RuntimeArgs, U256, U512, CLType,
};


pub mod did_cfg {
    pub const CONTRACT_NAME: &str = "CasperDIDRegistry8";
}

pub struct Sender(pub AccountHash);

pub struct Did {
    pub context: TestContext,
    pub ali: AccountHash,
    pub bob: AccountHash,
    pub joe: AccountHash,
}

impl Did{

    pub fn deployed() -> Did {
        let ali = PublicKey::ed25519_from_bytes([3u8; 32]).unwrap();
        let bob = PublicKey::ed25519_from_bytes([6u8; 32]).unwrap();
        let joe = PublicKey::ed25519_from_bytes([9u8; 32]).unwrap();

        let mut context = TestContextBuilder::new()
            .with_public_key(ali.clone(), U512::from(900_000_000_000_000_000u64))
            .with_public_key(bob.clone(), U512::from(900_000_000_000_000_000u64))
            .build();
        let session_code = Code::from("contract.wasm");
        let session_args = runtime_args! {
        };
        let session = SessionBuilder::new(session_code, session_args)
            .with_address((&ali).to_account_hash())
            .with_authorization_keys(&[ali.to_account_hash()])
            .build();
        context.run(session);

        Did {
            context: context,
            ali: ali.to_account_hash(),
            bob: bob.to_account_hash(),
            joe: joe.to_account_hash(),
        }
    }

    pub fn contract_hash(&self) -> Hash {
        self.context
            .query(self.ali, &[format!("{}_hash", did_cfg::CONTRACT_NAME)])
            .unwrap_or_else(|_| panic!("{} contract not found", did_cfg::CONTRACT_NAME))
            .into_t()
            .unwrap_or_else(|_| panic!("{} has wrong type", did_cfg::CONTRACT_NAME))
    }

    pub fn query_contract<T: CLTyped + FromBytes>(&self, name: &str) -> Option<T> {
        match self
            .context
            .query(self.ali, &[did_cfg::CONTRACT_NAME.to_string(), name.to_string()])
        {
            Err(_) => None,
            Ok(maybe_value) => {
                let value = maybe_value
                    .into_t()
                    //.unwrap();
                    .unwrap_or_else(|_| panic!("{} is not expected type.", name));
                Some(value)
            }
        }
    }

    fn call(&mut self, sender: Sender, method: &str, args: RuntimeArgs) {
        let Sender(address) = sender;
        let code = Code::Hash(self.contract_hash(), method.to_string());
        let session = SessionBuilder::new(code, args)
            .with_address(address)
            .with_authorization_keys(&[address])
            .build();
        self.context.run(session);
    }

    pub fn asd(&mut self,sender: Sender, identity: AccountHash){
        self.call(
            sender,
            "asd",
            runtime_args! {
                "identity" => identity,
            },
        )
    }
    pub fn call_asd(&mut self,
        asd_key: String) -> AccountHash{
        self.query_contract(&asd_key).unwrap()
    }

    pub fn identityOwner(&mut self,
        identity: AccountHash) -> AccountHash{
        let owner_key = format!("owner_{}", identity);
        //println!("{}",owner_key);
        let result = self.query_contract(&owner_key);
        if result != None{
            result.unwrap()
        }
        else {
            AccountHash::new([0u8;32])
        }
        //self.query_contract(&owner_key).unwrap()

    }

    pub fn changeOwner(&mut self,
        sender: Sender,
        identity: AccountHash, 
        newOwner: AccountHash){
        self.call(
            sender,
            "changeOwner",
            runtime_args! {
                "identity" => identity,
                "newOwner" => newOwner,
            },
        )
    }

    
    pub fn getDelegate(&mut self,
        identity: AccountHash,
        delegate_type: AccountHash,
        delegate: AccountHash) -> u64{
        let delegate_key = format!("delegate_{}_{}_{}", identity,delegate_type,delegate);
        //println!("{}",delegate_key);
        let result = self.query_contract(&delegate_key);
        if result != None{
            result.unwrap()
        }
        else {
            0u64
        }
    }


    pub fn addDelegate(&mut self,
        sender: Sender,
        identity: AccountHash, 
        delegateType: AccountHash,
        delegate: AccountHash,
        validity:u64){

        self.call(
            sender,
            "addDelegate",
            runtime_args! {
                "identity" => identity,
                "delegateType" => delegateType,
                "delegate" => delegate,
                "validity" => validity,
            },
        )
    }

    pub fn revokeDelegate(&mut self,
        sender: Sender,
        identity: AccountHash, 
        delegateType: AccountHash,
        delegate: AccountHash,
        validity:u64){

        self.call(
            sender,
            "revokeDelegate",
            runtime_args! {
                "identity" => identity,
                "delegateType" => delegateType,
                "delegate" => delegate,
            },
        )
    }

    pub fn getAttribute(&mut self,
        identity: AccountHash,
        name: String) -> (String,u64){
        let attribute_key = format!("attribute_{}_{}",identity,name);
        //println!("{}",attribute_key);
        let result:Option<(String,u64)> = self.query_contract(&attribute_key);
        if result != None{
            result.unwrap()
        }
        else {
            (String::from("NOoooNE"),0u64)
        }
    }

    pub fn setAttribute(&mut self,
        sender: Sender,
        identity: AccountHash, 
        name: String,
        value: String,
        validity:u64){

        self.call(
            sender,
            "setAttribute",
            runtime_args! {
                "identity" => identity,
                "name" => name,
                "value" => value,
                "validity" => validity,
            },
        )
    }

    pub fn revokeAttribute(&mut self,
        sender: Sender,
        identity: AccountHash, 
        name: String){

        self.call(
            sender,
            "revokeAttribute",
            runtime_args! {
                "identity" => identity,
                "name" => name,
            },
        )
    }

}
