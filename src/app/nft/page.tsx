'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import { NFT_CONTRACT_ADDRESS, NFT_ABI } from '@/app/lib/constants'
import Link from 'next/link'

export default function NFTPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [txHash, setTxHash] = useState('')

  const mintBadge = async () => {
    if (typeof window.ethereum === 'undefined')
      return alert('지갑을 연결해주세요.')

    setLoading(true)
    setStatus('메타데이터 업로드 중...')

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const userAddress = await signer.getAddress()

      // 1. IPFS에 업로드할 메타데이터 생성
      const metadata = {
        name: 'Re-Entrancy Slayer',
        description:
          'Proof of hacking the Re-Entrancy Level on Wargame Protocol.',
        image:
          'https://gateway.pinata.cloud/ipfs/QmZCU8A3eH6z6H4xXQ6k4y4k4k4k4k4k4k4k4k4k4k4', // 기본 해커 이미지 (예시)
        attributes: [
          { trait_type: 'Level', value: 'Re-Entrancy' },
          { trait_type: 'Difficulty', value: 'Hard' },
          { trait_type: 'Date', value: new Date().toISOString().split('T')[0] },
        ],
      }

      // 2. API를 통해 Pinata에 업로드
      const response = await fetch('/api/ipfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata }),
      })

      const { ipfsHash } = await response.json()
      if (!ipfsHash) throw new Error('IPFS 업로드 실패')

      const tokenURI = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
      setStatus(`IPFS 업로드 완료. 민팅 시작...`)

      // 3. 스마트 컨트랙트 호출 (Mint)
      const nftContract = new ethers.Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_ABI,
        signer
      )
      const tx = await nftContract.mintNFT(userAddress, tokenURI)

      setStatus('트랜잭션 대기 중...')
      await tx.wait()

      setTxHash(tx.hash)
      setStatus('발급 완료!')
    } catch (error) {
      console.error(error)
      setStatus('오류 발생: 콘솔을 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-green-500 font-mono flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full border border-green-800 bg-slate-900/50 p-8 shadow-[0_0_30px_rgba(0,255,0,0.1)] text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tighter drop-shadow-lg">
            MISSION ACCOMPLISHED
          </h1>
          <p className="text-green-600 tracking-widest text-sm">
            PROTOCOL_OVERRIDE_SUCCESSFUL
          </p>
        </div>

        <div className="w-48 h-48 mx-auto bg-black border-2 border-green-600/50 flex items-center justify-center relative overflow-hidden group">
          {/* 홀로그램 효과 */}
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.1)_50%)] bg-[size:10px_4px]"></div>
          <span className="text-6xl">🏆</span>
        </div>

        <div className="space-y-4">
          <p className="text-slate-400 text-sm">
            축하합니다. 취약점을 성공적으로 공략했습니다.
            <br />
            업적을 증명하는{' '}
            <strong className="text-green-400">화이트해커 배지</strong>를
            발급받으세요.
          </p>

          {!txHash ? (
            <button
              onClick={mintBadge}
              disabled={loading}
              className="w-full py-4 bg-green-600 hover:bg-green-500 text-black font-bold transition-all disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : 'MINT NFT BADGE'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-green-900/30 border border-green-500/50 rounded text-xs break-all">
                <p className="text-green-300 font-bold mb-1">TX HASH:</p>
                {txHash}
              </div>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full py-3 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-colors font-bold"
              >
                VIEW ON ETHERSCAN
              </a>
            </div>
          )}

          <div className="text-xs text-slate-600 mt-2">
            STATUS: {status || 'WAITING_FOR_SIGNATURE'}
          </div>
        </div>

        <Link
          href="/"
          className="block text-slate-500 hover:text-white text-sm underline decoration-green-800 underline-offset-4"
        >
          &lt; RETURN TO MAIN TERMINAL
        </Link>
      </div>
    </div>
  )
}
