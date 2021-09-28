//SPDX-License-Identifier: MIT
pragma solidity >=0.4.4;

contract VCRegistry {

  enum VCStatus {NotExists, Active, Revoked}
  
  struct VC{
    address issuer;
    bytes32 dataMerkleRoot;
    uint64 dateIssued;
    VCStatus status; 
    bool isRevokable;
    VCStatusChange[] statusChanges;
  }

  struct VCStatusChange {
    VCStatus oldStatus;
    VCStatus newStatus;
    uint64 dateChanged;
    address who;
  }

  mapping (bytes32 => VC) public verifiableCredentials; //mapping dataMerkleRoot => VC (storage of all VCs in registry)

  function issueVC(bytes32 _dataMerkleRoot, bool _isRevokable) public virtual returns (bool){
    require(verifiableCredentials[_dataMerkleRoot].status == VCStatus.NotExists, "VC Already exists");
    verifiableCredentials[_dataMerkleRoot] = VC({
      issuer:msg.sender,
      dataMerkleRoot: _dataMerkleRoot,
      dateIssued: uint64(block.timestamp),
      status: VCStatus.Active,
      isRevokable: _isRevokable,
      statusChanges: VCStatusChange[]});
    return true;
  }

  function revokeVC(bytes32 _dataMerkleRoot) public virtual returns (bool){
    require(verifiableCredentials[_dataMerkleRoot].isRevokable, "VC is non-revokable");
    require(verifiableCredentials[_dataMerkleRoot].issuer == msg.sender, "Only Issuer can revoke VC");
    require(verifiableCredentials[_dataMerkleRoot].status == VCStatus.Active, "Already revoked");
    verifiableCredentials[_dataMerkleRoot].status = VCStatus.Revoked;
    verifiableCredentials[_dataMerkleRoot].statusChanges.push(
        VCStatusChange(
            VCStatus.Active,
            VCStatus.Revoked,
            uint64(block.timestamp),
            msg.sender));
    return true;
  }

  function reActivateVC(bytes32 _dataMerkleRoot) public virtual returns (bool){
    require(verifiableCredentials[_dataMerkleRoot].issuer == msg.sender, "Only Issuer can revoke VC");
    require(verifiableCredentials[_dataMerkleRoot].status == VCStatus.Revoked, "Already active");
    verifiableCredentials[_dataMerkleRoot].status = VCStatus.Active;
    verifiableCredentials[_dataMerkleRoot].statusChanges.push(
        VCStatusChange(
            VCStatus.Revoked,
            VCStatus.Active, 
            uint64(block.timestamp),
            msg.sender));
    return true;
  }

}