import { PropsWithChildren, useEffect, useState } from 'react'
import { add, format } from 'date-fns'
import { getCookie } from 'cookies-next'

import { appState } from '~utils/appState'

import TopHeader from '~components/Header'
import UpdateToast from '~components/UpdateToast'

import './index.scss'

interface Props {}

const Layout = ({ children }: PropsWithChildren<Props>) => {
  const [updateToastOpen, setUpdateToastOpen] = useState(false)

  useEffect(() => {
    const cookie = getToastCookie()
    const now = new Date()
    const updatedAt = new Date(appState.version.updated_at)
    const validUntil = add(updatedAt, { days: 7 })

    if (now < validUntil && !cookie.seen) setUpdateToastOpen(true)
  }, [])

  function getToastCookie() {
    const updatedAt = new Date(appState.version.updated_at)
    const cookieValues = getCookie(`update-${format(updatedAt, 'yyyy-MM-dd')}`)
    return cookieValues
      ? (JSON.parse(cookieValues as string) as { seen: true })
      : { seen: false }
  }

  function handleToastActionClicked() {
    setUpdateToastOpen(false)
  }

  function handleToastOpenChanged(open: boolean) {
    setUpdateToastOpen(false)
  }

  return (
    <>
      <TopHeader />
      {/* TODO: Don't show toast on about pages */}
      <UpdateToast
        open={updateToastOpen}
        updateType="feature"
        onActionClicked={handleToastActionClicked}
        onOpenChange={handleToastOpenChanged}
        lastUpdated={appState.version.updated_at}
      />
      <main>{children}</main>
    </>
  )
}

export default Layout
