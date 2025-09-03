'use client'

import { useEffect } from 'react'
import { appState } from '~/utils/appState'

interface VersionHydratorProps {
  version: AppUpdate | null
}

export default function VersionHydrator({ version }: VersionHydratorProps) {
  useEffect(() => {
    if (version && version.updated_at) {
      appState.version = version
    }
  }, [version])
  
  return null
}