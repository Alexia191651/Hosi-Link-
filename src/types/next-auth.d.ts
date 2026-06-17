import { UserRole } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      role: UserRole
      firstName: string
      lastName: string
    }
  }

  interface User {
    id: string
    email: string
    role: UserRole
    firstName: string
    lastName: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    firstName: string
    lastName: string
  }
}