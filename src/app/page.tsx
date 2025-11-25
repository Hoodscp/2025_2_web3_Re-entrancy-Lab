'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import {
  FACTORY_ADDRESS,
  FACTORY_ABI,
  VULNERABLE_CODE,
} from '@/app/lib/constants'
import LogTerminal from './components/LogTerminal'

export default function Home() {
  const [account, setAccount] = useState('')
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [targetInstance, setTargetInstance] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // 로그 추가 헬퍼 함수
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString()
    setLogs((prev) => [`[${time}] ${msg}`, ...prev])
  }

  // 지갑 연결
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask가 설치되어 있지 않습니다.')
      return
    }
    try {
      const _provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await _provider.send('eth_requestAccounts', [])
      setProvider(_provider)
      setAccount(accounts[0])
      addLog(`Wallet Connected: ${accounts[0]}`)
    } catch (err) {
      console.error(err)
      addLog('Connection Failed')
    }
  }

  // 문제 인스턴스 생성 (Deploy)
  const createLevel = async () => {
    if (!provider) return
    setLoading(true)
    addLog('Initiating Level Instance...')

    try {
      const signer = await provider.getSigner()
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer)

      // 가스 한도를 넉넉하게 설정하여 트랜잭션 전송
      const tx = await factory.createInstance({
        value: ethers.parseEther('0.001'),
        gasLimit: 3000000,
      })
      addLog(`Tx Sent: ${tx.hash}`)

      const receipt = await tx.wait()

      // 이벤트 로그에서 생성된 인스턴스 주소 자동 추출
      const iface = new ethers.Interface(FACTORY_ABI)
      let deployedAddress = null

      for (const log of receipt.logs) {
        try {
          const parsedLog = iface.parseLog(log)
          if (parsedLog && parsedLog.name === 'InstanceCreated') {
            deployedAddress = parsedLog.args[0]
            break
          }
        } catch (e) {
          // 다른 이벤트 무시
        }
      }

      if (deployedAddress) {
        addLog(`Instance Deployed at: ${deployedAddress}`)
        setTargetInstance(deployedAddress)
        alert(`인스턴스가 생성되었습니다.\n주소: ${deployedAddress}`)
      } else {
        addLog(
          'Instance Deployed, but failed to extract address automatically.'
        )
      }
    } catch (err) {
      console.error(err)
      addLog('Deployment Failed. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  // 정답 검증 (Check Balance)
  const validateLevel = async () => {
    if (!provider || !targetInstance) {
      alert('지갑을 연결하고 인스턴스 주소를 입력해주세요.')
      return
    }

    try {
      const balance = await provider.getBalance(targetInstance)
      const ethBalance = ethers.formatEther(balance)

      addLog(`Target Balance: ${ethBalance} ETH`)

      if (balance === BigInt(0)) {
        addLog('[SUCCESS] Level Cleared! The contract is empty.')
        alert('성공: 해킹에 성공하여 잔액을 모두 탈취했습니다.')
      } else {
        addLog('[FAILED] Contract still has funds.')
        alert('실패: 컨트랙트에 아직 잔액이 남아있습니다.')
      }
    } catch (err) {
      console.error(err)
      addLog('Validation Error: 주소를 다시 확인해주세요.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-green-500 font-mono p-4 md:p-10 selection:bg-green-900 selection:text-white">
      <div className="max-w-4xl mx-auto border border-green-800 shadow-lg">
        {/* Header */}
        <header className="border-b border-green-800 p-6 flex justify-between items-center bg-slate-900">
          <h1 className="text-2xl font-bold tracking-tighter">
            RE-ENTRANCY_WARGAME
          </h1>
          <button
            onClick={connectWallet}
            className="border border-green-600 px-4 py-2 hover:bg-green-900 transition-colors text-sm"
          >
            {account
              ? `${account.slice(0, 6)}...${account.slice(-4)}`
              : 'CONNECT WALLET'}
          </button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Panel: Mission & Code */}
          <div className="p-6 border-r border-green-800 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2 text-white">
                [MISSION OBJECTIVE]
              </h2>
              <p className="text-sm text-green-400/80 leading-relaxed">
                이 컨트랙트에는 재진입(Re-Entrancy) 취약점이 존재합니다. 당신의
                목표는 인스턴스의 모든 Ether를 탈취하여 잔액을 0으로 만드는
                것입니다.
                <br />
                <br />
                1. 인스턴스 생성 (Create Instance)
                <br />
                2. Remix 등을 이용해 공격 수행
                <br />
                3. 잔액 확인 (Verify)
              </p>
            </div>

            <div className="bg-black p-4 border border-green-900 text-xs overflow-x-auto">
              <pre>{VULNERABLE_CODE}</pre>
            </div>
          </div>

          {/* Right Panel: Interaction */}
          <div className="p-6 space-y-8 bg-slate-900/50">
            {/* Step 1 */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white border-l-4 border-green-500 pl-3">
                01. DEPLOY INSTANCE
              </h3>
              <p className="text-xs text-green-600">
                Cost: 0.001 Sepolia ETH + Gas
              </p>
              <button
                onClick={createLevel}
                disabled={loading || !account}
                className="w-full bg-green-900/20 border border-green-600 py-3 hover:bg-green-500 hover:text-black transition-all font-bold disabled:opacity-50"
              >
                {loading ? 'DEPLOYING...' : 'CREATE NEW INSTANCE'}
              </button>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white border-l-4 border-green-500 pl-3">
                02. VERIFY HACK
              </h3>
              <input
                type="text"
                placeholder="Instance Address (0x...)"
                value={targetInstance}
                onChange={(e) => setTargetInstance(e.target.value)}
                className="w-full bg-black border border-green-800 p-3 text-sm focus:outline-none focus:border-green-500 text-green-400"
              />
              <button
                onClick={validateLevel}
                className="w-full bg-green-900/20 border border-green-600 py-3 hover:bg-green-500 hover:text-black transition-all font-bold"
              >
                CHECK BALANCE
              </button>
            </div>

            {/* Terminal Logs Component */}
            <LogTerminal logs={logs} />
          </div>
        </main>
      </div>
    </div>
  )
}
