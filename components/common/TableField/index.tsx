import classNames from 'classnames'
import styles from './index.module.scss'

interface Props {
  name: string
  label: string
  description?: string
  image?: {
    className?: String
    alt?: string
    src: string[]
  }
  className?: string
  children: React.ReactNode
}

const TableField = (props: Props) => {
  const classes = classNames(
    {
      [styles.field]: true,
    },
    props.className?.split(' ').map((className) => styles[className])
  )

  const image = () => {
    return (
      props.image &&
      props.image.src.length > 0 && (
        <div
          className={classNames(
            {
              [styles.preview]: true,
            },
            props.image.className
              ?.split(' ')
              .map((className) => styles[className])
          )}
        >
          <img
            alt={props.image.alt}
            srcSet={props.image.src.join(', ')}
            src={props.image.src[0]}
          />
        </div>
      )
    )
  }

  return (
    <div className={classes}>
      <div className={styles.left}>
        <div className={styles.info}>
          <h3>{props.label}</h3>
          {props.description && <p>{props.description}</p>}
        </div>
        <div className={styles.image}>{image()}</div>
      </div>

      <div className={styles.right}>
        <div className={styles.image}>{image()}</div>
        {props.children}
      </div>
    </div>
  )
}

export default TableField
