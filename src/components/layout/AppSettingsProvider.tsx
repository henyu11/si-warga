'use client'

import React, { createContext, useContext, useState } from 'react'

export interface AppSettingsContextType {
  settings: Record<string, string>
  appName: string
  communityName: string
  updateSettingsState: (newSettings: Partial<Record<string, string>>) => void
}

const AppSettingsContext = createContext<AppSettingsContextType>({
  settings: {},
  appName: 'siWarga Palmut',
  communityName: 'Kavling Palanji & Mutiara Indah',
  updateSettingsState: () => {},
})

export function AppSettingsProvider({
  initialSettings,
  children,
}: {
  initialSettings: Record<string, string>
  children: React.ReactNode
}) {
  const [settings, setSettings] = useState<Record<string, string>>(initialSettings)

  const updateSettingsState = (newSettings: Partial<Record<string, string>>) => {
    setSettings((prev) => {
      const next = { ...prev }
      for (const [key, value] of Object.entries(newSettings)) {
        if (value !== undefined) {
          next[key] = value
        }
      }
      return next
    })
  }

  const appName = settings.app_name || 'siWarga Palmut'
  const communityName = settings.community_name || 'Kavling Palanji & Mutiara Indah'

  return (
    <AppSettingsContext.Provider
      value={{
        settings,
        appName,
        communityName,
        updateSettingsState,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  )
}

export function useAppSettings() {
  return useContext(AppSettingsContext)
}
