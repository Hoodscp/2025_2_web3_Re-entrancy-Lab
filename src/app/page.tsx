'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import { ethers } from 'ethers'
import Link from 'next/link'
import {
  FACTORY_ADDRESS,
  FACTORY_ABI,
  VULNERABLE_CODE,
} from '@/app/lib/constants'
import LogTerminal from './components/LogTerminal'
import {
  MatrixRain,
  CopyButton,
  AttackCodeModal,
  SecureCodeComparison,
  HintSystem,
  Typewriter,
} from './components/GameComponents'
import { Trophy, Code, AlertTriangle, Cpu } from 'lucide-react'
//import { db, auth } from '@/app/lib/firebase'
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { signInAnonymously } from 'firebase/auth'

// Fade Animation Helper
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
  const [isCleared, setIsCleared] = useState(false)

  // UX States
  const [showAttackModal, setShowAttackModal] = useState(false)
  const gameSectionRef = useRef<HTMLDivElement>(null)

  // // Firestore & Auth Init
  // useEffect(() => {
  //   signInAnonymously(auth).catch((error) =>
  //     console.error('Auth Error:', error)
  //   )
  // }, [])

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

  // // Record to Hall of Fame Logic
  // const recordVictory = async (addr: string) => {
  //   try {
  //     if (!auth.currentUser) return

  //     // 중복 체크 (선택 사항)
  //     const q = query(
  //       collection(db, 'hall_of_fame'),
  //       where('address', '==', addr)
  //     )
  //     const snapshot = await getDocs(q)

  //     if (snapshot.empty) {
  //       await addDoc(collection(db, 'hall_of_fame'), {
  //         address: addr,
  //         clearedAt: serverTimestamp(),
  //         level: 'Re-Entrancy',
  //       })
  //       console.log('Victory recorded to Hall of Fame')
  //     }
  //   } catch (e) {
  //     console.error('Failed to record victory', e)
  //   }
  // }

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
        setIsCleared(true)
        // await recordVictory(account) // Save to Firestore
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
    <div className="bg-slate-950 text-green-500 font-mono selection:bg-green-900 selection:text-white overflow-x-hidden h-screen overflow-y-auto scroll-smooth relative">
      <div className="scanlines"></div> {/* CRT Effect */}
      <MatrixRain /> {/* Matrix Effect */}
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center relative border-b border-green-900/30 z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/80 to-slate-950"></div>

        <div className="z-10 text-center space-y-8 p-4">
          <FadeInSection>
            <div className="space-y-2">
              <p className="text-green-600 tracking-[0.3em] text-sm animate-pulse flex justify-center gap-2 items-center">
                <AlertTriangle size={14} /> SYSTEM STATUS: COMPROMISED
              </p>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] glitch-hover cursor-default">
                RE-ENTRANCY
              </h1>
              <h2 className="text-2xl md:text-3xl font-bold text-green-600/80">
                <Typewriter text="WARGAME_PROTOCOL_V1" delay={100} />
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
            <div className="flex gap-4 justify-center">
              <button
                onClick={scrollToGame}
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-green-600 font-lg hover:bg-green-500 rounded"
              >
                <span className="relative flex items-center gap-3">
                  INITIALIZE HACKING
                  <Cpu
                    size={20}
                    className="group-hover:rotate-180 transition-transform duration-500"
                  />
                </span>
              </button>
              <Link
                href="/hall-of-fame"
                className="px-8 py-4 border border-green-600 text-green-500 font-bold hover:bg-green-900/30 rounded flex items-center gap-2"
              >
                <Trophy size={20} /> HALL OF FAME
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>
      {/* Main Game Section */}
      <div
        ref={gameSectionRef}
        className="min-h-screen py-20 px-4 md:px-10 flex items-center justify-center relative z-10"
      >
        <FadeInSection className="w-full max-w-6xl mx-auto">
          <div className="border border-green-800/50 shadow-[0_0_50px_rgba(0,255,0,0.1)] bg-slate-900/90 backdrop-blur-md rounded-lg overflow-hidden">
            <header className="border-b border-green-800 p-6 flex justify-between items-center bg-black/40">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                <h1 className="text-xl font-bold tracking-tighter text-white">
                  CONTROL_PANEL
                </h1>
              </div>
              <button
                onClick={connectWallet}
                className={`border px-4 py-2 rounded transition-all text-sm font-bold ${
                  account
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-green-700 hover:bg-green-800 text-slate-300'
                }`}
              >
                {account
                  ? `CONNECTED: ${account.slice(0, 6)}...`
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
                        타겟 컨트랙트의 취약한{' '}
                        <code className="bg-slate-800 px-1 text-green-300">
                          withdraw
                        </code>{' '}
                        함수를 이용하여 잔액을 탈취하십시오.
                      </p>
                      <button
                        onClick={() => setShowAttackModal(true)}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded flex items-center gap-2 border border-slate-600 transition-colors"
                      >
                        <Code size={14} /> GET ATTACK CODE TEMPLATE
                      </button>
                    </div>

                    {/* HINT SYSTEM */}
                    <HintSystem />
                  </div>
                </FadeInSection>

                <FadeInSection delay={400}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-slate-500">
                        VULNERABLE_SOURCE_CODE.sol
                      </span>
                    </div>
                    <div className="bg-black p-4 border border-green-900/50 text-xs overflow-x-auto rounded shadow-inner custom-scrollbar relative">
                      <pre className="font-mono text-green-300/90">
                        {VULNERABLE_CODE}
                      </pre>
                    </div>

                    {/* Educational: Secure Code Comparison (Shows after clear or toggle) */}
                    {isCleared && (
                      <div className="mt-4">
                        <p className="text-sm text-green-400 font-bold mb-2">
                          ✅ 분석 완료: 보안 패치 제안
                        </p>
                        <SecureCodeComparison />
                      </div>
                    )}
                  </div>
                </FadeInSection>
              </div>

              <div className="p-8 space-y-8 bg-black/20">
                <FadeInSection delay={300}>
                  <div className="space-y-4 relative group">
                    <div className="absolute -left-8 top-0 bottom-0 w-1 bg-green-800 group-hover:bg-green-500 transition-colors"></div>
                    <h3 className="text-lg font-bold text-white pl-2">
                      01. TARGET DEPLOYMENT
                    </h3>
                    <button
                      onClick={createLevel}
                      disabled={loading || !account}
                      className="w-full bg-green-900/30 hover:bg-green-600 hover:text-white border border-green-600 text-green-500 py-4 font-bold transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                          DEPLOYING...
                        </span>
                      ) : (
                        'CREATE NEW INSTANCE'
                      )}
                    </button>
                  </div>
                </FadeInSection>

                <FadeInSection delay={500}>
                  <div className="space-y-4 relative group">
                    <div className="absolute -left-8 top-0 bottom-0 w-1 bg-green-800 group-hover:bg-green-500 transition-colors"></div>
                    <h3 className="text-lg font-bold text-white pl-2 flex justify-between">
                      02. VERIFICATION
                      {targetInstance && (
                        <CopyButton text={targetInstance} label="ADDR" />
                      )}
                    </h3>
                    <input
                      type="text"
                      placeholder="Paste Instance Address (0x...)"
                      value={targetInstance}
                      onChange={(e) => setTargetInstance(e.target.value)}
                      className="w-full bg-slate-950 border border-green-900/50 p-4 text-sm focus:outline-none focus:border-green-500 text-green-400 placeholder-slate-700 transition-colors rounded"
                    />

                    {!isCleared ? (
                      <button
                        onClick={validateLevel}
                        className="w-full bg-transparent border border-green-600 text-green-500 py-4 hover:bg-green-600 hover:text-white transition-all font-bold rounded"
                      >
                        CHECK BALANCE
                      </button>
                    ) : (
                      <Link
                        href="/nft"
                        className="block w-full text-center bg-yellow-500 hover:bg-yellow-400 text-black py-4 font-bold transition-all shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-pulse rounded"
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
      {/* Modals */}
      <AttackCodeModal
        isOpen={showAttackModal}
        onClose={() => setShowAttackModal(false)}
        targetAddress={targetInstance}
      />
    </div>
  )
}
