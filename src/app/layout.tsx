import type { Metadata } from 'next'
import { Ubuntu } from 'next/font/google' // 1. Geist 대신 Ubuntu를 import
import './globals.css'

// 2. Ubuntu 폰트 설정
// Ubuntu는 Variable 폰트가 아니므로 weight(굵기)를 반드시 지정해야 합니다.
const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'], // 사용할 굵기들을 배열로 지정
  variable: '--font-ubuntu', // Tailwind 등을 위해 변수명 지정 (선택사항)
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Reentrancy Lab',
  description: 'A Web3 security lab to practice reentrancy attacks.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      {/* 3. body className에 ubuntu.className을 적용하면 전체 적용됨 */}
      <body className={ubuntu.className}>{children}</body>
    </html>
  )
}
