// 'use client'

// import { useEffect, useState } from 'react'
// import { db } from '@/app/lib/firebase'
// import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
// import Link from 'next/link'
// import { Trophy, ArrowLeft, User } from 'lucide-react'

// interface Winner {
//   id: string
//   address: string
//   clearedAt: any
//   level: string
// }

// export default function HallOfFame() {
//   const [winners, setWinners] = useState<Winner[]>([])
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const fetchWinners = async () => {
//       try {
//         // "clearedAt" 기준으로 내림차순 정렬 (최신순)
//         const q = query(
//           collection(db, 'hall_of_fame'),
//           orderBy('clearedAt', 'desc'),
//           limit(50)
//         )
//         const querySnapshot = await getDocs(q)
//         const data = querySnapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         })) as Winner[]
//         setWinners(data)
//       } catch (error) {
//         console.error('Error fetching hall of fame:', error)
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchWinners()
//   }, [])

//   return (
//     <div className="min-h-screen bg-slate-950 text-green-500 font-mono p-4 md:p-10 relative overflow-hidden">
//       {/* Background Grid */}
//       <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

//       <div className="max-w-4xl mx-auto relative z-10">
//         <header className="mb-12 flex items-center justify-between">
//           <Link
//             href="/"
//             className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
//           >
//             <ArrowLeft size={20} /> BACK TO TERMINAL
//           </Link>
//           <div className="flex items-center gap-3">
//             <Trophy size={32} className="text-yellow-500" />
//             <h1 className="text-3xl font-black text-white tracking-tighter">
//               HALL OF FAME
//             </h1>
//           </div>
//         </header>

//         <div className="bg-slate-900/80 border border-green-800 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,255,0,0.1)] backdrop-blur-sm">
//           <div className="p-4 border-b border-green-800 bg-black/40 grid grid-cols-12 text-sm font-bold text-slate-400">
//             <div className="col-span-1 text-center">#</div>
//             <div className="col-span-7">HACKER ADDRESS</div>
//             <div className="col-span-4 text-right">TIMESTAMP</div>
//           </div>

//           {loading ? (
//             <div className="p-10 text-center text-slate-500 animate-pulse">
//               LOADING DATA...
//             </div>
//           ) : winners.length === 0 ? (
//             <div className="p-10 text-center text-slate-500">
//               NO RECORDS YET. BE THE FIRST!
//             </div>
//           ) : (
//             <div className="divide-y divide-green-900/30">
//               {winners.map((winner, index) => (
//                 <div
//                   key={winner.id}
//                   className="p-4 grid grid-cols-12 items-center hover:bg-green-900/10 transition-colors group"
//                 >
//                   <div className="col-span-1 text-center font-bold text-slate-500 group-hover:text-green-400">
//                     {index + 1}
//                   </div>
//                   <div className="col-span-7 font-mono text-slate-300 flex items-center gap-2">
//                     <User size={14} className="text-slate-600" />
//                     {winner.address}
//                     {index < 3 && (
//                       <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded ml-2">
//                         TOP {index + 1}
//                       </span>
//                     )}
//                   </div>
//                   <div className="col-span-4 text-right text-xs text-slate-500">
//                     {winner.clearedAt?.toDate().toLocaleString()}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }

'use client'

import Link from 'next/link'
import { ArrowLeft, Construction, AlertTriangle, Hammer } from 'lucide-react'

export default function HallOfFame() {
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
              ERROR_CODE: DB_CONNECTION_PENDING
            </span>
          </div>

          <p className="leading-relaxed">
            현재 명예의 전당(Hall of Fame) 데이터베이스 시스템을 구축하고
            있습니다.
            <br />
            서버 연결 작업이 완료된 후 다시 접속해 주십시오.
          </p>

          <div className="text-xs font-mono bg-black/50 p-4 rounded border border-slate-800 text-left space-y-1">
            <p className="text-green-500">$ check_status hall_of_fame</p>
            <p className="text-slate-500">&gt; Initializing connection...</p>
            <p className="text-red-500">
              &gt; Error: Firebase config missing or invalid.
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
