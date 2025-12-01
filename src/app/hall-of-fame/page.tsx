'use client'

import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { HOF_CONTRACT_ADDRESS, HOF_ABI } from '@/app/lib/constants'
import Link from 'next/link'
import { Trophy, ArrowLeft, User, Clock } from 'lucide-react'

interface Winner {
  hacker: string
  timestamp: number
  message: string
}

export default function HallOfFame() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        // 읽기 전용이므로 메타마스크 연결 없이도 읽을 수 있도록 RPC Provider 사용 권장
        // 하지만 편의상 window.ethereum이 있으면 그것을 쓰고, 없으면 빈 배열 처리
        let provider
        if (typeof window.ethereum !== 'undefined') {
          provider = new ethers.BrowserProvider(window.ethereum)
        } else {
          // 메타마스크가 없는 경우를 대비해 Sepolia 공용 RPC URL 사용 가능
          // provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
          console.log('No wallet found')
          setLoading(false)
          return
        }

        const contract = new ethers.Contract(
          HOF_CONTRACT_ADDRESS,
          HOF_ABI,
          provider
        )

        // 데이터 가져오기
        const data = await contract.getAllWinners()

        // 데이터 가공 (Solidity 결과는 Proxy 객체일 수 있음)
        const formattedData = data.map((item: any) => ({
          hacker: item.hacker,
          timestamp: Number(item.timestamp), // BigInt -> Number 변환
          message: item.message,
        }))

        // 최신순 정렬 (timestamp 내림차순)
        formattedData.sort((a: Winner, b: Winner) => b.timestamp - a.timestamp)

        setWinners(formattedData)
      } catch (error) {
        console.error('Error fetching hall of fame:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWinners()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-green-500 font-mono p-4 md:p-10 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-12 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} /> BACK TO TERMINAL
          </Link>
          <div className="flex items-center gap-3">
            <Trophy size={32} className="text-yellow-500" />
            <h1 className="text-3xl font-black text-white tracking-tighter">
              HALL OF FAME (ON-CHAIN)
            </h1>
          </div>
        </header>

        <div className="bg-slate-900/80 border border-green-800 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,255,0,0.1)] backdrop-blur-sm">
          <div className="p-4 border-b border-green-800 bg-black/40 grid grid-cols-12 text-sm font-bold text-slate-400">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-7">HACKER ADDRESS</div>
            <div className="col-span-4 text-right">TIMESTAMP</div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500 animate-pulse">
              SYNCING WITH BLOCKCHAIN...
            </div>
          ) : winners.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              NO RECORDS ON CHAIN. BE THE FIRST!
            </div>
          ) : (
            <div className="divide-y divide-green-900/30">
              {winners.map((winner, index) => (
                <div
                  key={index}
                  className="p-4 grid grid-cols-12 items-center hover:bg-green-900/10 transition-colors group"
                >
                  <div className="col-span-1 text-center font-bold text-slate-500 group-hover:text-green-400">
                    {index + 1}
                  </div>
                  <div className="col-span-7 font-mono text-slate-300 flex items-center gap-2">
                    <User size={14} className="text-slate-600" />
                    {winner.hacker}
                    {index < 3 && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded ml-2">
                        TOP {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="col-span-4 text-right text-xs text-slate-500 flex items-center justify-end gap-2">
                    <Clock size={12} />
                    {new Date(winner.timestamp * 1000).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
