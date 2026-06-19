import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const sans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'] 
})

export const metadata: Metadata = {
  title: 'iTools - Executive Committee Operating System',
  description: 'Designed for IEEE Student Branches',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light">
      <body className={sans.className}>
        {children}
      </body>
    </html>
  )
}
