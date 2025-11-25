// ----------------------------------------------------------------
// [설정] 배포한 ReentranceLevel 컨트랙트 주소를 여기에 입력하세요.
export const FACTORY_ADDRESS = '0x64c11D1E2c7F5499b936c928A406a877d345b12e'
// ----------------------------------------------------------------

export const FACTORY_ABI = [
  'function createInstance() public payable returns (address)',
  'event InstanceCreated(address instanceAddress, address player)',
]

export const VULNERABLE_CODE = `contract Reentrance {
    mapping(address => uint) public balances;

    function withdraw(uint _amount) public {
        if(balances[msg.sender] >= _amount) {
            // VULNERABILITY: Interaction before Effect
            (bool result,) = msg.sender.call{value:_amount}("");
            require(result);
            unchecked { balances[msg.sender] -= _amount; }
        }
    }
}`
