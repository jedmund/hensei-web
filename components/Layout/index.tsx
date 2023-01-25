import type { ReactElement } from 'react'
import TopHeader from '~components/Header'
import Toast from '~components/Toast'
import UpdateToast from '~components/UpdateToast'

import './index.scss'
interface Props {
  children: ReactElement
}

const Layout = ({ children }: Props) => {
  return (
    <>
      <TopHeader />
      <UpdateToast open={true} updateType="feature" />
      <main>{children}</main>
    </>
  )
}

export default Layout
