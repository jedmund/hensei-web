import React from 'react'
import styles from './index.module.scss'

interface Props {
  groupName: string
  name: string
  selected: boolean
  tabIndex?: number
  children: string
  onClick: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const Segment: React.FC<Props> = (props: Props) => {
  // Selects the segment when the user presses the spacebar
  const handleKeyDown = (event: React.KeyboardEvent<HTMLLabelElement>) => {
    if (event.key === ' ') {
      event.preventDefault()
      event.currentTarget.click()
    }
  }

  return (
    <div className={styles.segment}>
      <input
        name={props.groupName}
        id={props.name}
        value={props.name}
        type="radio"
        checked={props.selected}
        onChange={props.onClick}
      />
      <label
        htmlFor={props.name}
        tabIndex={props.tabIndex}
        onKeyDown={handleKeyDown}
      >
        {props.children}
      </label>
    </div>
  )
}

export default Segment
