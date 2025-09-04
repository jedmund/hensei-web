'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { add, format } from 'date-fns'
import { getCookie } from 'cookies-next'
import { useSnapshot } from 'valtio'

import { appState } from '~/utils/appState'
import UpdateToast from '~/components/toasts/UpdateToast'

interface UpdateToastClientProps {
  initialVersion?: AppUpdate | null
}

export default function UpdateToastClient({ initialVersion }: UpdateToastClientProps) {
  const pathname = usePathname()
  const [updateToastOpen, setUpdateToastOpen] = useState(false)
  const { version } = useSnapshot(appState)
  
  // Use initialVersion for SSR, then switch to appState version after hydration
  const effectiveVersion = version?.updated_at ? version : initialVersion

  useEffect(() => {
    if (effectiveVersion && effectiveVersion.updated_at) {
      const cookie = getToastCookie()
      const now = new Date()
      const updatedAt = new Date(effectiveVersion.updated_at)
      const validUntil = add(updatedAt, { days: 7 })

      if (now < validUntil && !cookie.seen) setUpdateToastOpen(true)
    }
  }, [effectiveVersion?.updated_at])

  function getToastCookie() {
    if (appState.version && appState.version.updated_at !== '') {
      const updatedAt = new Date(appState.version.updated_at)
      const cookieValues = getCookie(
        `update-${format(updatedAt, 'yyyy-MM-dd')}`
      )
      return cookieValues
        ? (JSON.parse(cookieValues as string) as { seen: true })
        : { seen: false }
    } else {
      return { seen: false }
    }
  }

  function handleToastActionClicked() {
    setUpdateToastOpen(false)
  }

  function handleToastClosed() {
    setUpdateToastOpen(false)
  }
  
  const path = pathname?.replaceAll('/', '') || ''

  // Only render toast if we have valid version data with update_type
  if (!['about', 'updates', 'roadmap'].includes(path) && effectiveVersion && effectiveVersion.update_type) {
    return (
      <UpdateToast
        open={updateToastOpen}
        updateType={effectiveVersion.update_type}
        onActionClicked={handleToastActionClicked}
        onCloseClicked={handleToastClosed}
        lastUpdated={effectiveVersion.updated_at}
      />
    )
  }
  
  return null
}