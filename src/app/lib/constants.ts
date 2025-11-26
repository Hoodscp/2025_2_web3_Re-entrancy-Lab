// [중요] 변수 앞에 'export'를 붙여야 다른 파일에서 import 할 수 있습니다.

// 1. 배포한 ReentranceLevel 팩토리 컨트랙트 주소
export const FACTORY_ADDRESS = '0x64c11D1E2c7F5499b936c928A406a877d345b12e'

// 2. 배포한 NFT 컨트랙트 주소 (반드시 Remix에서 배포 후 값을 채워주세요!)
export const NFT_CONTRACT_ADDRESS = '0x64039eb93D82dD59d7a8B897246461295890fd83'

export const FACTORY_ABI = [
  'function createInstance() public payable returns (address)',
  'event InstanceCreated(address instanceAddress, address player)',
]

// [이 부분이 빠져있어서 에러가 발생한 것입니다]
export const NFT_ABI = [
  'function mintNFT(address recipient, string memory tokenURI) public returns (uint256)',
]

// 3. 화면에 보여줄 취약한 컨트랙트 소스 코드
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
