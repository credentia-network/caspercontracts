use casper_engine_test_support::{Code, Hash, SessionBuilder, TestContext, TestContextBuilder};
use casper_types::{
    account::AccountHash, bytesrepr::FromBytes, runtime_args, AsymmetricType, CLTyped, PublicKey,
    RuntimeArgs, U256, U512, CLType,
};



pub mod did_cfg {
    pub const CONTRACT_NAME: &str = "CasperDIDRegistry";

}

pub struct Sender(pub AccountHash);

pub struct Did {
    context: TestContext,
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
            context,
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

    pub fn identityOwner(&mut self,
                        sender: Sender,
                        identity:AccountHash){
        self.call(
            sender,
            "identityOwner",
            runtime_args! {
                "identity" => identity,
            },
        );
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

}