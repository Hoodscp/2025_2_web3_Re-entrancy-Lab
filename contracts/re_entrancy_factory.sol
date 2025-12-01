// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Reentrance {
    mapping(address => uint) public balances;

    function donate(address _to) public payable {
        balances[_to] += msg.value;
    }

    function balanceOf(address _who) public view returns (uint balance) {
        return balances[_who];
    }

    function withdraw(uint _amount) public {
        if(balances[msg.sender] >= _amount) {
            (bool result,) = msg.sender.call{value:_amount}("");
            require(result);
            unchecked {
                balances[msg.sender] -= _amount;
            }
        }
    }

    receive() external payable {}
}

contract ReentranceLevel {
    event InstanceCreated(address instanceAddress, address player);

    function createInstance() public payable returns (address) {
        require(msg.value >= 0.001 ether, "Need 0.001 ETH to fund the instance");
        Reentrance instance = new Reentrance();
        (bool sent, ) = address(instance).call{value: msg.value}("");
        require(sent, "Failed to send Ether to instance");
        
        emit InstanceCreated(address(instance), msg.sender);
        return address(instance);
    }

    function validateInstance(address payable _instance) public view returns (bool) {
        return _instance.balance == 0;
    }
}