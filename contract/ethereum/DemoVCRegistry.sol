pragma solidity >=0.4.4;

import "./VCRegistry.sol";

contract DemoVCRegistry is VCRegistry {


  struct DemoVC{
    address holder;
    bytes32 ipfsHash;
    bytes32 schemaHash;
  }

  struct VPRequest {
    bytes32 schemaHash;
    uint16[] requestedSchemaFields;
    bytes32 responseIPFSHash;
    address receiver;
  }

  /***************** EXTRA Mappings */
  address registryOwner;

  mapping (bytes32 => DemoVC) public demoVCRegistry; //mapping dataMerkleRoot => DemoVC
  mapping (address => bytes32[]) public issuedVCs; //mapping issuer => VCs
  mapping (address => bytes32[]) public holdedVCs; //mapping holder => VCs

  mapping (bytes32 => bool) public supportedSchemas;

  uint256 requestCounter;
  mapping (uint256 => VPRequest) public vpRequests; //verifiable Presentations request. 
  mapping (address => uint256[]) public requestsSent;
  mapping (address => uint256[]) public requestsReceived;

  constructor() {
    registryOwner = msg.sender;
  }


  //schema operations
  function setSchema(bytes32 _schemaHash, bool _enabled) public {
    require(msg.sender == registryOwner, "Not a registry owner");
    supportedSchemas[_schemaHash] = _enabled;
  }

  // //VC Operations
  // function issueVC(bytes32 _dataMerkleRoot, bool _isRevokable) public virtual override returns (bool){
  //   require (false, "Please use issueDemoVC function");
  //   return false;
  // }

  function issueDemoVC(bytes32 _dataMerkleRoot,  bool _isRevokable, address _holder, bytes32 _ipfsHash, bytes32 _schemaHash) public returns (bool){
      require(super.issueVC(_dataMerkleRoot, _isRevokable), "VC not issued");
      require(supportedSchemas[_schemaHash], "this Schema is not supported by the registry");

      demoVCRegistry[_dataMerkleRoot] = DemoVC(_holder, _ipfsHash, _schemaHash);
      issuedVCs[msg.sender].push(_dataMerkleRoot);
      holdedVCs[_holder].push(_dataMerkleRoot);
      return true;
  }

  //VP Operations
    function sendVPRequest(bytes32 _schemaHash, uint16[] memory _requestedFields, address _to) public returns (bool){
    uint256 nextCounterValue = ++requestCounter;
    vpRequests[nextCounterValue] = VPRequest(_schemaHash,_requestedFields, bytes32(0), _to);
    requestsSent[msg.sender].push(nextCounterValue);
    requestsReceived[_to].push(nextCounterValue);
    return true;
  }

  function registerVPResponse(uint256 _vpRequestID, bytes32 _ipfsHash) public returns (bool){
    require(vpRequests[_vpRequestID].receiver == msg.sender, "Not a VPRequest receiver");
    vpRequests[_vpRequestID].responseIPFSHash = _ipfsHash;
    return true;
  }

  //VC Views

  function getVCDataForIssuerLength(address _issuer) public view returns(uint256){
    return issuedVCs[_issuer].length;
  }

  function getVCDataForIssuer(address _issuer, uint256 _index) public view returns(bytes32, uint64, uint8, bool, address, bytes32, bytes32){
    require (_index < issuedVCs[_issuer].length, "Index out of range");
    bytes32 _dataMerkleRoot = issuedVCs[_issuer][_index];
    return (
      _dataMerkleRoot,
      verifiableCredentials[_dataMerkleRoot].dateIssued,
      verifiableCredentials[_dataMerkleRoot].status,
      verifiableCredentials[_dataMerkleRoot].isRevokable,
      demoVCRegistry[_dataMerkleRoot].holder,
      demoVCRegistry[_dataMerkleRoot].ipfsHash,
      demoVCRegistry[_dataMerkleRoot].schemaHash
    );
  }

  function getVCDataForHolderLength(address _holder) public view returns(uint256){
    return holdedVCs[_holder].length;
  }

  function getVCDataForHolder(address _holder, uint256 _index) public view returns(bytes32, uint64, uint8, bool, address, bytes32, bytes32){
    require (_index < holdedVCs[_holder].length, "Index out of range");
    bytes32 _dataMerkleRoot = holdedVCs[_holder][_index];
    return (
      _dataMerkleRoot,
      verifiableCredentials[_dataMerkleRoot].dateIssued,
      verifiableCredentials[_dataMerkleRoot].status,
      verifiableCredentials[_dataMerkleRoot].isRevokable,
      demoVCRegistry[_dataMerkleRoot].holder,
      demoVCRegistry[_dataMerkleRoot].ipfsHash,
      demoVCRegistry[_dataMerkleRoot].schemaHash
    );
  }

  //VP views

  function getPresentationRequestsSentLength(address from) public view returns(uint256) {
    return requestsSent[from].length;
  }

  function getPresentationRequestsReceivedtLength(address to) public view returns(uint256) {
    return requestsReceived[to].length;
  }

  function getPresentationData(uint256 _vpRequestID) public view returns(bytes32, uint256, bytes32, address, address){
    return (vpRequests[_vpRequestID].schemaHash,
    vpRequests[_vpRequestID].requestedSchemaFields.length,
    vpRequests[_vpRequestID].responseIPFSHash,
    vpRequests[_vpRequestID].sender,
    vpRequests[_vpRequestID].receiver);
  }

  function getPresentationDataFieldByIndex(uint256 _vpRequestID, uint256 _index) public view returns(uint16){
    require(_index < vpRequests[_vpRequestID].requestedSchemaFields.length, "Index out of range");
    return vpRequests[_vpRequestID].requestedSchemaFields[_index];
  }


}