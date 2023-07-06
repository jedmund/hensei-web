import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import { Editor } from '@tiptap/react'
import Tooltip from '~components/common/Tooltip'

import styles from './index.module.scss'

interface Props {
  editor: Editor
  action: string
  level?: number
  icon: React.ReactNode
  onClick: () => void
}

const ToolbarIcon = ({ editor, action, level, icon, onClick }: Props) => {
  const { t } = useTranslation('common')
  const classes = classNames({
    [styles.button]: true,
    [styles.active]: level
      ? editor.isActive(action, { level: level })
      : editor.isActive(action),
  })

  return (
    <Tooltip content={t(`toolbar.tooltips.${action}`)}>
      <button onClick={onClick} className={classes}>
        {icon}
      </button>
    </Tooltip>
  )
}

export default ToolbarIcon
