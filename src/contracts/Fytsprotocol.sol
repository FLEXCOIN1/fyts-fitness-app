// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FytSProtocol {
    mapping(address => uint256) public balances;
    mapping(address => ValidationData[]) public userValidations;
    
    uint256 public totalSupply = 10_000_000 * 10**18; // 10M tokens
    uint256 public protocolReserve;
    uint256 public circulatingSupply;
    
    struct ValidationData {
        bytes32 dataHash;
        uint256 timestamp;
        uint256 networkReward;
    }
    
    event NetworkValidation(address validator, uint256 reward, bytes32 dataHash);
    
    constructor() {
        protocolReserve = totalSupply * 60 / 100; // 60% protocol reserve
        balances[msg.sender] = protocolReserve; // Your initial allocation
        circulatingSupply = totalSupply - protocolReserve;
    }
    
    function contributeValidationData(bytes32 dataHash, uint256 distance, uint256 duration) external {
        require(distance > 0 && duration > 0, "Invalid validation data");
        
        uint256 networkReward = calculateNetworkContribution(distance, duration);
        require(networkReward <= circulatingSupply, "Insufficient protocol tokens");
        
        balances[msg.sender] += networkReward;
        circulatingSupply -= networkReward;
        
        userValidations[msg.sender].push(ValidationData({
            dataHash: dataHash,
            timestamp: block.timestamp,
            networkReward: networkReward
        }));
        
        emit NetworkValidation(msg.sender, networkReward, dataHash);
    }
    
    function calculateNetworkContribution(uint256 distance, uint256 duration) private pure returns (uint256) {
        // Network utility calculation (not reward calculation)
        uint256 baseContribution = distance * 10**18 / 161; // ~10 tokens per 0.1 mile
        uint256 qualityBonus = duration > 1800 ? baseContribution / 20 : 0; // Network quality bonus
        return baseContribution + qualityBonus;
    }
}