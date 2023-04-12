import React from 'react'

import './index.scss'

interface Props {
  groupName: string
  name: string
  selected: boolean
  children: string
  onClick: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const Segment: React.FC<Props> = (props: Props) => {
  return (
    <div className="Segment">
      <input
        name={props.groupName}
        id={props.name}
        value={props.name}
        type="radio"
        checked={props.selected}
        onChange={props.onClick}
      />
      <label htmlFor={props.name}>{props.children}</label>
    </div>
  )
}

export default Segment
