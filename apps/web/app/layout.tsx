import './globals.css'
import Providers from './providers'

export const metadata = {
  title: 'CP-Tutor',
  description: 'Online Judge + AI Mentor cho C++ Competitive Programming',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
