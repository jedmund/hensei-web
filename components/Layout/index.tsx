import type { ReactElement } from 'react'
import TopHeader from '~components/TopHeader'

interface Props {
  children: ReactElement
}

const Layout = ({ children }: Props) => {
  return (
    <>
      <TopHeader />
      <main>{children}</main>
    </>
  )
}

export default Layout
