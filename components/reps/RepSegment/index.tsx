import React, { PropsWithChildren } from 'react'

import styles from './index.module.scss'

interface Props {
  controlGroup: string
  inputName: string
  name: string
  selected: boolean
  onClick: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const RepSegment = ({ children, ...props }: PropsWithChildren<Props>) => {
  return (
    <div className="RepSegment">
      <input
        name={props.controlGroup}
        id={props.inputName}
        value={props.inputName}
        type="radio"
        checked={props.selected}
        onChange={props.onClick}
      />
      <label htmlFor={props.inputName}>
        <div className="Wrapper">
          {children}
          <div className="Title">{props.name}</div>
        </div>
      </label>
    </div>
  )
}

export default RepSegment
