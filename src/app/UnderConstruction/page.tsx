'use client'

import Link from 'next/link'
import { ArrowLeft, Construction, AlertTriangle, Hammer } from 'lucide-react'

export default function UnderConstruction() {
  return (
    <div className="min-h-screen bg-slate-950 text-green-500 font-mono p-4 md:p-10 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      {/* Animated Scanline */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] opacity-20"></div>

      <div className="z-10 text-center space-y-8 max-w-2xl p-8 border border-yellow-600/30 bg-slate-900/80 rounded-lg shadow-[0_0_50px_rgba(234,179,8,0.1)] backdrop-blur-sm relative overflow-hidden">
        {/* Caution Strip Design */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>

        <div className="flex justify-center mb-6 pt-4">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 animate-pulse"></div>
            <div className="flex gap-4">
              <Construction
                size={64}
                className="text-yellow-500 relative z-10 animate-bounce"
                style={{ animationDuration: '3s' }}
              />
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 drop-shadow-lg">
          SYSTEM MAINTENANCE
        </h1>

        <div className="space-y-6 text-slate-400">
          <div className="flex flex-col items-center justify-center gap-2 text-yellow-500/90 font-bold text-lg bg-yellow-500/10 py-3 rounded border border-yellow-500/20">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} />
              <span>MODULE_OFFLINE</span>
            </div>
            <span className="text-xs font-normal text-yellow-600/80 tracking-widest">
              ERROR_CODE: 503_SERVICE_UNAVAILABLE
            </span>
          </div>

          <p className="leading-relaxed">
            현재 해당 페이지는 서버 점검 및 유지보수 작업으로 인해
            <br />
            일시적으로 접속이 불가능한 상태입니다.
            <br />
            서버 연결 작업이 완료된 후 다시 접속해 주십시오.
          </p>

          <div className="text-xs font-mono bg-black/50 p-4 rounded border border-slate-800 text-left space-y-1">
            <p className="text-green-500">$ check_status</p>
            <p className="text-slate-500">&gt; Initializing connection...</p>
            <p className="text-red-500">
              &gt; Error: config missing or invalid.
            </p>
            <p className="text-yellow-500">
              &gt; Status: Under Construction (503 Service Unavailable)
            </p>
          </div>
        </div>

        <div className="pt-8 pb-2">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded border border-slate-600 transition-all hover:border-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            RETURN TO MAIN TERMINAL
          </Link>
        </div>
      </div>
    </div>
  )
}
