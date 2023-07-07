import { PropsWithChildren, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { add, format } from 'date-fns'
import { getCookie } from 'cookies-next'

import { appState } from '~utils/appState'

import TopHeader from '~components/Header'
import UpdateToast from '~components/toasts/UpdateToast'

interface Props {}

const Layout = ({ children }: PropsWithChildren<Props>) => {
  const router = useRouter()
  const [updateToastOpen, setUpdateToastOpen] = useState(false)

  useEffect(() => {
    if (appState.version) {
      const cookie = getToastCookie()
      const now = new Date()
      const updatedAt = new Date(appState.version.updated_at)
      const validUntil = add(updatedAt, { days: 7 })

      if (now < validUntil && !cookie.seen) setUpdateToastOpen(true)
    }
  }, [])

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

  const updateToast = () => {
    const path = router.asPath.replaceAll('/', '')

    return (
      !['about', 'updates', 'roadmap'].includes(path) &&
      appState.version && (
        <UpdateToast
          open={updateToastOpen}
          updateType={appState.version.update_type}
          onActionClicked={handleToastActionClicked}
          onCloseClicked={handleToastClosed}
          lastUpdated={appState.version.updated_at}
        />
      )
    )
  }

  const ServerAvailable = () => {
    return (
      <>
        <TopHeader />
        {updateToast()}
      </>
    )
  }

  return (
    <>
      {appState.version && ServerAvailable()}
      <main>{children}</main>
    </>
  )
}

export default Layout
