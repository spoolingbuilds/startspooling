import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Welcome',
  description: 'Welcome to StartSpooling',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
