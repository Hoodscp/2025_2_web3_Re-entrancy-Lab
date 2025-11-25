import React from 'react'

interface LogTerminalProps {
  logs: string[]
}

export default function LogTerminal({ logs }: LogTerminalProps) {
  return (
    <div className="mt-8">
      <div className="text-xs text-green-700 mb-1">SYSTEM LOGS</div>
      <div className="bg-black h-40 border border-green-900 p-2 overflow-y-auto text-xs font-mono space-y-1 custom-scrollbar">
        {logs.length === 0 && (
          <span className="text-green-900">Waiting for input...</span>
        )}
        {logs.map((log, i) => (
          <div key={i} className="break-all">
            <span className="text-green-600 mr-2">&gt;</span>
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}
