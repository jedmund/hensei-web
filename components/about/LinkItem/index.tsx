import { ComponentProps } from 'react'
import classNames from 'classnames'

import ShareIcon from '~public/icons/Share.svg'
import styles from './index.module.scss'

interface Props extends ComponentProps<'div'> {
  title: string
  link: string
  icon: React.ReactNode
}

const LinkItem = ({ icon, title, link, className, ...props }: Props) => {
  const classes = classNames(
    {
      [styles.item]: true,
    },
    className?.split(' ').map((c) => styles[c])
  )

  return (
    <div className={classes}>
      <a href={link} target="_blank" rel="noreferrer">
        <div className={styles.left}>
          <i className={styles.icon}>{icon}</i>
          <h3>{title}</h3>
        </div>
        <ShareIcon className={styles.shareIcon} />
      </a>
    </div>
  )
}

export default LinkItem
