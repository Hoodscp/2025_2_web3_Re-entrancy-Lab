'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import { ethers } from 'ethers'
import {
  FACTORY_ADDRESS,
  FACTORY_ABI,
  VULNERABLE_CODE,
} from '@/app/lib/constants'
import LogTerminal from './components/LogTerminal'

// ----------------------------------------------------------------
// [Scroll Animation Component]
// 스크롤 감지하여 나타나고 사라지는 효과를 주는 래퍼 컴포넌트
// 수정사항: 애니메이션이 한 번만 실행되도록 변경 (깜빡임/끊김 방지)
// ----------------------------------------------------------------
const FadeInSection = ({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) => {
  const [isVisible, setVisible] = useState(false)
  const domRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 화면에 들어오면 true로 설정하고 관찰 중지 (Trigger Once)
          if (entry.isIntersecting) {
            setVisible(true)
            if (entry.target) observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    ) // 10% 정도 보이면 트리거

    const { current } = domRef
    if (current) observer.observe(current)
    return () => {
      if (current) observer.unobserve(current)
    }
  }, [])

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible
          ? 'opacity-100 translate-y-0 blur-0'
          : 'opacity-0 translate-y-20 blur-sm'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export default function Home() {
  const [account, setAccount] = useState('')
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [targetInstance, setTargetInstance] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const gameSectionRef = useRef<HTMLDivElement>(null)

  // 게임 섹션으로 스크롤 이동
  const scrollToGame = () => {
    gameSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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

      if (receipt) {
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
    // 수정사항: h-screen overflow-y-auto 추가 (더블 스크롤 방지), scroll-smooth 추가
    <div className="bg-slate-950 text-green-500 font-mono selection:bg-green-900 selection:text-white overflow-x-hidden h-screen overflow-y-auto scroll-smooth">
      {/* 1. Hero Section (인트로) */}
      <section className="min-h-screen flex flex-col items-center justify-center relative border-b border-green-900/30">
        {/* 배경 그리드 효과 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950"></div>

        <div className="z-10 text-center space-y-8 p-4">
          <FadeInSection>
            <div className="space-y-2">
              <p className="text-green-600 tracking-[0.3em] text-sm animate-pulse">
                SYSTEM STATUS: COMPROMISED
              </p>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">
                RE-ENTRANCY
              </h1>
              <h2 className="text-2xl md:text-3xl font-bold text-green-600/80">
                WARGAME_PROTOCOL_V1
              </h2>
            </div>
          </FadeInSection>

          <FadeInSection delay={300}>
            <p className="max-w-2xl mx-auto text-slate-400 text-sm md:text-base leading-relaxed px-4">
              블록체인 역사상 가장 치명적인 취약점을 탐구하십시오.
              <br />
              스마트 컨트랙트의 허점을 파고들어 자금을 탈취하고, 보안의 본질을
              이해하십시오.
            </p>
          </FadeInSection>

          <FadeInSection delay={600}>
            <button
              onClick={scrollToGame}
              className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-green-600 font-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 ring-offset-slate-900 rounded"
            >
              <span className="absolute inset-0 w-full h-full -mt-1 rounded opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
              <span className="relative flex items-center gap-3">
                INITIALIZE HACKING
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 group-hover:translate-y-1 transition-transform"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </span>
            </button>
          </FadeInSection>
        </div>
      </section>

      {/* 2. Main Game Section (기존 게임 영역) */}
      <div
        ref={gameSectionRef}
        className="min-h-screen py-20 px-4 md:px-10 flex items-center justify-center bg-slate-950 relative"
      >
        <FadeInSection className="w-full max-w-6xl mx-auto">
          <div className="border border-green-800/50 shadow-[0_0_50px_rgba(0,255,0,0.05)] bg-slate-900/30 backdrop-blur-sm">
            {/* Header */}
            <header className="border-b border-green-800 p-6 flex justify-between items-center bg-slate-900/80">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                <h1 className="text-xl font-bold tracking-tighter text-white">
                  CONTROL_PANEL
                </h1>
              </div>
              <button
                onClick={connectWallet}
                className={`border px-4 py-2 transition-all text-sm font-bold ${
                  account
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-green-700 hover:bg-green-800 text-slate-300'
                }`}
              >
                {account
                  ? `CONNECTED: ${account.slice(0, 6)}...${account.slice(-4)}`
                  : '[ CONNECT WALLET ]'}
              </button>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left Panel: Mission & Code */}
              <div className="p-8 border-r border-green-800/50 space-y-8">
                <FadeInSection delay={200}>
                  <div>
                    <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
                      <span className="text-green-500">&gt;</span> MISSION
                      BRIEFING
                    </h2>
                    <div className="text-sm text-slate-300 leading-relaxed space-y-4">
                      <p>
                        <strong className="text-green-400">목표:</strong> 타겟
                        컨트랙트의 취약한
                        <code className="bg-slate-800 px-1 py-0.5 mx-1 rounded text-green-300">
                          withdraw
                        </code>
                        함수를 이용하여 잔액을 탈취하십시오.
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-slate-400 ml-2">
                        <li>인스턴스 생성 (Create Instance)</li>
                        <li>Remix IDE 등을 이용해 공격 컨트랙트 배포</li>
                        <li>재진입(Re-Entrancy) 공격 수행</li>
                        <li>잔액 검증 (Verify Hack)</li>
                      </ol>
                    </div>
                  </div>
                </FadeInSection>

                <FadeInSection delay={400}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-slate-500">
                        VULNERABLE_SOURCE_CODE.sol
                      </span>
                    </div>
                    <div className="bg-black p-4 border border-green-900/50 text-xs overflow-x-auto rounded shadow-inner custom-scrollbar">
                      <pre className="font-mono text-green-300/90">
                        {VULNERABLE_CODE}
                      </pre>
                    </div>
                  </div>
                </FadeInSection>
              </div>

              {/* Right Panel: Interaction */}
              <div className="p-8 space-y-8 bg-slate-900/50">
                {/* Step 1 */}
                <FadeInSection delay={300}>
                  <div className="space-y-4 relative group">
                    <div className="absolute -left-8 top-0 bottom-0 w-1 bg-green-800 group-hover:bg-green-500 transition-colors"></div>
                    <h3 className="text-lg font-bold text-white pl-2">
                      01. TARGET DEPLOYMENT
                    </h3>
                    <p className="text-xs text-slate-400 pl-2">
                      Cost: 0.001 Sepolia ETH + Gas
                    </p>
                    <button
                      onClick={createLevel}
                      disabled={loading || !account}
                      className="w-full bg-green-600 hover:bg-green-500 text-white py-4 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,255,0,0.2)] hover:shadow-[0_0_25px_rgba(0,255,0,0.4)]"
                    >
                      {loading ? 'DEPLOYING...' : 'CREATE NEW INSTANCE'}
                    </button>
                  </div>
                </FadeInSection>

                {/* Step 2 */}
                <FadeInSection delay={500}>
                  <div className="space-y-4 relative group">
                    <div className="absolute -left-8 top-0 bottom-0 w-1 bg-green-800 group-hover:bg-green-500 transition-colors"></div>
                    <h3 className="text-lg font-bold text-white pl-2">
                      02. VERIFICATION
                    </h3>
                    <input
                      type="text"
                      placeholder="Paste Instance Address (0x...)"
                      value={targetInstance}
                      onChange={(e) => setTargetInstance(e.target.value)}
                      className="w-full bg-slate-950 border border-green-900/50 p-4 text-sm focus:outline-none focus:border-green-500 text-green-400 placeholder-slate-700 transition-colors"
                    />
                    <button
                      onClick={validateLevel}
                      className="w-full bg-transparent border border-green-600 text-green-500 py-4 hover:bg-green-600 hover:text-white transition-all font-bold"
                    >
                      CHECK BALANCE
                    </button>
                  </div>
                </FadeInSection>

                {/* Terminal Logs Component */}
                <FadeInSection delay={700}>
                  <div className="pt-6 border-t border-green-900/30">
                    <LogTerminal logs={logs} />
                  </div>
                </FadeInSection>
              </div>
            </main>
          </div>
        </FadeInSection>
      </div>
    </div>
  )
}
