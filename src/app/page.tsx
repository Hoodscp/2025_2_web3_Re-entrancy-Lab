'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import { ethers } from 'ethers'
import {
  FACTORY_ADDRESS,
  FACTORY_ABI,
  VULNERABLE_CODE,
} from '@/app/lib/constants'
import LogTerminal from './components/LogTerminal'
import Link from 'next/link' // [추가] 링크 컴포넌트

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
          if (entry.isIntersecting) {
            setVisible(true)
            if (entry.target) observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

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
  const [isCleared, setIsCleared] = useState(false) // [추가] 클리어 상태 관리

  const gameSectionRef = useRef<HTMLDivElement>(null)

  const scrollToGame = () => {
    gameSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString()
    setLogs((prev) => [`[${time}] ${msg}`, ...prev])
  }

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

  const createLevel = async () => {
    if (!provider) return
    setLoading(true)
    addLog('Initiating Level Instance...')

    try {
      const signer = await provider.getSigner()
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer)

      const tx = await factory.createInstance({
        value: ethers.parseEther('0.001'),
        gasLimit: 3000000,
      })
      addLog(`Tx Sent: ${tx.hash}`)

      const receipt = await tx.wait()

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
          } catch (e) {}
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

  // [수정] 정답 검증 및 성공 처리
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
        setIsCleared(true) // 성공 상태 true로 변경
        alert('성공! NFT 발급 자격을 획득했습니다.')
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
    <div className="bg-slate-950 text-green-500 font-mono selection:bg-green-900 selection:text-white overflow-x-hidden h-screen overflow-y-auto scroll-smooth">
      {/* 1. Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center relative border-b border-green-900/30">
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

      {/* 2. Main Game Section */}
      <div
        ref={gameSectionRef}
        className="min-h-screen py-20 px-4 md:px-10 flex items-center justify-center bg-slate-950 relative"
      >
        <FadeInSection className="w-full max-w-6xl mx-auto">
          <div className="border border-green-800/50 shadow-[0_0_50px_rgba(0,255,0,0.05)] bg-slate-900/30 backdrop-blur-sm">
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

              <div className="p-8 space-y-8 bg-slate-900/50">
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

                    {/* [수정] 성공 여부에 따라 버튼 변경 */}
                    {!isCleared ? (
                      <button
                        onClick={validateLevel}
                        className="w-full bg-transparent border border-green-600 text-green-500 py-4 hover:bg-green-600 hover:text-white transition-all font-bold"
                      >
                        CHECK BALANCE
                      </button>
                    ) : (
                      <Link
                        href="/nft"
                        className="block w-full text-center bg-yellow-500 hover:bg-yellow-400 text-black py-4 font-bold transition-all shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-pulse"
                      >
                        CLAIM REWARD (MINT NFT) &rarr;
                      </Link>
                    )}
                  </div>
                </FadeInSection>

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
