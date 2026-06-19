import { getServerSession } from 'next-auth'
import Providers from '@/app/providers'
import { authOptions } from '@/lib/auth'

export default async function SubmissionsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  return <Providers session={session}>{children}</Providers>
}
