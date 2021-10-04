prepare:
	rustup target add wasm32-unknown-unknown

build-contract:
	cargo +nightly build --release -p did --target wasm32-unknown-unknown
	cargo +nightly build --release -p vcregistry --target wasm32-unknown-unknown
	cargo +nightly build --release -p demovcregistry --target wasm32-unknown-unknown

test-only:
	cargo test -p tests -- --nocapture --test-threads 1

copy-wasm-file-to-test:
	cp target/wasm32-unknown-unknown/release/contract.wasm tests/wasm

test: build-contract copy-wasm-file-to-test test-only

clippy:
	cargo clippy --all-targets --all -- -D warnings -A renamed_and_removed_lints

check-lint: clippy
	cargo fmt --all -- --check

lint: clippy
	cargo fmt --all
	
clean:
	cargo clean
	rm -rf tests/wasm/contract.wasm
