import type { ReactElement } from 'react'
import TopHeader from '~components/TopHeader'
import BottomHeader from '~components/BottomHeader'

interface Props {
    children: ReactElement
}

const Layout = ({children}: Props) => {
  return (
    <>
      <TopHeader />
      <main>{children}</main>
      <BottomHeader />
    </>
  )
}

export default Layout