import classNames from 'classnames'
import styles from './index.module.scss'

interface Props {
  name: string
  label: string
  description?: string
  className?: string
  imageAlt?: string
  imageClass?: string
  imageSrc?: string[]
  children: React.ReactNode
}

const TableField = (props: Props) => {
  const image = () => {
    return props.imageSrc && props.imageSrc.length > 0 ? (
      <div className={`preview ${props.imageClass}`}>
        <img
          alt={props.imageAlt}
          srcSet={props.imageSrc.join(', ')}
          src={props.imageSrc[0]}
        />
      </div>
    ) : (
      ''
    )
  }

  return (
    <div className={classNames({ TableField: true }, props.className)}>
      <div className="Left">
        <div className="Info">
          <h3>{props.label}</h3>
          {props.description && <p>{props.description}</p>}
        </div>
        <div className="Image">{image()}</div>
      </div>

      <div className="Right">
        <div className="Image">{image()}</div>
        {props.children}
      </div>
    </div>
  )
}

export default TableField
