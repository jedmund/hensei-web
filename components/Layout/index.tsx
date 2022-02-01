import type { ReactElement } from 'react'
import Header from '~components/Header'

interface Props {
    children: ReactElement
}

const Layout = ({children}: Props) => {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  )
}

export default Layout