# Casper DID Framework Smart Contracts

Implementation of the Casper DID Registry contract as a part of the [Casper DID Method Specification](https://github.com/credentia-network/Docs/blob/main/Casper-did-method-spec.md) 

## Installing tookits and building the project

1. Install Rust
    1. Install Rust (if you don’t have it installed already). Please follow this document for installation guidelines: [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)
    2. Install wasm target builder. Please follow this document for installation guidelines: [https://www.hellorust.com/setup/wasm-target/](https://www.hellorust.com/setup/wasm-target/)
    3. Set "nightly" toolchain
    ```console
    rustup update
    rustup target add wasm32-unknown-unknown --toolchain nightly
    ```

2. Build the project: simply build with npm
    ```console
    npm i
    ```

    then

    ```console
    npm run build
    ```

## Operating DID Regirstry smart contract

Please follow [this detailed guide](https://github.com/credentia-network/Docs/blob/main/smart-contract.md) to learn how to operate with this DID Registry Contract