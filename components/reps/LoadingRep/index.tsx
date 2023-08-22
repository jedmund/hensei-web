import classNames from 'classnames'
import styles from './index.module.scss'

interface Props {}

const LoadingRep = (props: Props) => {
  const numWeapons: number = 9

  const mainhandClasses = classNames({
    [styles.weapon]: true,
    [styles.mainhand]: true,
    [styles.placeholder]: true,
  })

  const weaponClasses = classNames({
    [styles.weapon]: true,
    [styles.grid]: true,
    [styles.placeholder]: true,
  })

  return (
    <div className={styles.gridRep}>
      <div className={styles.details}>
        <div className={styles.top}>
          <div className={styles.info}>
            <div
              className={classNames({
                [styles.title]: true,
                [styles.placeholder]: true,
                [styles.regular]: true,
              })}
            />
            <div className={styles.properties}>
              <span className={styles.raid} />
            </div>
          </div>
        </div>
        <div className={styles.attributed}>
          <span className={styles.user}>
            <figure
              className={classNames({
                [styles.image]: true,
                [styles.placeholder]: true,
              })}
            />
            <span
              className={classNames({
                [styles.text]: true,
                [styles.placeholder]: true,
                [styles.small]: true,
              })}
            />
          </span>
          <div
            className={classNames({
              [styles.timestamp]: true,
              [styles.placeholder]: true,
              [styles.small]: true,
            })}
          />
        </div>
      </div>
      <div className={styles.weaponGrid}>
        <div className={mainhandClasses} />

        <ul className={styles.weapons}>
          {Array.from(Array(numWeapons)).map((x, i) => {
            return (
              <li
                key={`placeholder-${Math.random()}`}
                className={weaponClasses}
              />
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default LoadingRep
