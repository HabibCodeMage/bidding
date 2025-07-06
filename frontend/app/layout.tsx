import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Real-Time Bidding System',
  description: 'A real-time bidding system built with Next.js and NestJS',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
       
          {children}
          <Toaster />
      </body>
    </html>
  )
}
