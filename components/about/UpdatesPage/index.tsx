import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import classNames from 'classnames'

import ContentUpdate2022 from '../updates/ContentUpdate2022'
import ContentUpdate2023 from '../updates/ContentUpdate2023'
import ContentUpdate2024 from '../updates/ContentUpdate2024'

import styles from './index.module.scss'

const UpdatesPage = () => {
  const common = useTranslations('common')
  const updates = useTranslations('updates')

  const classes = classNames(styles.updates, 'PageContent')

  const [activeYear, setActiveYear] = useState(new Date().getFullYear())
  const getYearButtonClass = (year: number) =>
    classNames({
      [styles.yearButton]: true,
      [styles.active]: activeYear === year,
    })

  // Render the component based on the active year
  const renderContentUpdate = () => {
    switch (activeYear) {
      case 2022:
        return <ContentUpdate2022 />
      case 2023:
        return <ContentUpdate2023 />
      case 2024:
        return <ContentUpdate2024 />
      default:
        return <div>{updates('noUpdates')}</div>
    }
  }

  return (
    <div className={classes}>
      <div className={styles.top}>
        <h1>{common('about.segmented_control.updates')}</h1>
        <div className={styles.yearSelector}>
          <button
            className={getYearButtonClass(2024)}
            onClick={() => setActiveYear(2024)}
          >
            2024
          </button>
          <button
            className={getYearButtonClass(2023)}
            onClick={() => setActiveYear(2023)}
          >
            2023
          </button>
          <button
            className={getYearButtonClass(2022)}
            onClick={() => setActiveYear(2022)}
          >
            2022
          </button>
        </div>
      </div>
      {renderContentUpdate()}
    </div>
  )
}

export default UpdatesPage
