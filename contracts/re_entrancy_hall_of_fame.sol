// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HallOfFame {
    struct Winner {
        address hacker;
        uint256 timestamp;
        string message; // 해커가 남기는 승리 메시지 (선택 사항)
    }

    Winner[] public winners;
    mapping(address => bool) public hasRegistered; // 중복 등록 방지

    event NewChampion(address indexed hacker, uint256 timestamp);

    // 명예의 전당 등록 함수
    // _instance: 사용자가 해킹한 문제 컨트랙트 주소
    function register(address _instance, string memory _message) external {
        // 1. 이미 등록된 사용자인지 확인
        require(!hasRegistered[msg.sender], "Already registered");

        // 2. 실제로 해킹에 성공했는지 검증 (잔액이 0이어야 함)
        require(_instance.balance == 0, "Instance is not cleared yet");

        // 3. 기록 저장
        winners.push(Winner(msg.sender, block.timestamp, _message));
        hasRegistered[msg.sender] = true;

        emit NewChampion(msg.sender, block.timestamp);
    }

    // 전체 리스트 가져오기
    function getAllWinners() external view returns (Winner[] memory) {
        return winners;
    }

    // 등록된 해커 수
    function getWinnerCount() external view returns (uint256) {
        return winners.length;
    }
}