import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: ({ token, req }) => {
      const pathname = req.nextUrl.pathname
      if (pathname.startsWith('/admin')) return token?.role === 'admin'
      return Boolean(token)
    },
  },
})

export const config = {
  matcher: ['/problems/:path*', '/submissions/:path*', '/admin/:path*'],
}
