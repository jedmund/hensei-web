import { useEffect, useState } from 'react'
import MentionEditor from '~components/common/MentionEditor'
import TableField from '~components/common/TableField'

import styles from './index.module.scss'

interface Props
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  label: string
  description?: string
  placeholder?: string
  onUpdate: (content: string[]) => void
}

const MentionTableField = ({
  label,
  description,
  placeholder,
  ...props
}: Props) => {
  return (
    <TableField
      {...props}
      name={props.name || ''}
      className="mention"
      label={label}
    >
      <MentionEditor
        bound={true}
        placeholder={placeholder}
        onUpdate={props.onUpdate}
      />
    </TableField>
  )
}

export default MentionTableField
