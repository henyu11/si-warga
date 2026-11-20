'use client'

import React, { createContext, useContext } from 'react'
import type { SessionUser } from '@/server/services/auth.service'

const UserContext = createContext<SessionUser | null>(null)

export function UserProvider({
  user,
  children,
}: {
  user: SessionUser
  children: React.ReactNode
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useUser(): SessionUser | null {
  return useContext(UserContext)
}

export function RoleGuard({
  roles,
  children,
  fallback = null,
}: {
  roles: Array<'ADMIN' | 'BENDAHARA' | 'KETUA'>
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const user = useUser()
  if (!user || !roles.includes(user.role)) {
    return <>{fallback}</>
  }
  return <>{children}</>
}
