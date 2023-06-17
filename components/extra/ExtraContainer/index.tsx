import React, { PropsWithChildren } from 'react'
import './index.scss'

// Props
interface Props {}

const ExtraContainer = ({ children, ...props }: PropsWithChildren<Props>) => {
  return <div className="ExtraContainer">{children}</div>
}

export default ExtraContainer
