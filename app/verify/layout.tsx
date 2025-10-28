import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify Email | StartSpooling',
  robots: {
    index: false,
    follow: false,
  },
}

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
