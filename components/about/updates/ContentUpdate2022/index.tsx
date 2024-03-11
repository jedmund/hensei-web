import React from 'react'
import { useTranslation } from 'next-i18next'
import ContentUpdate from '~components/about/ContentUpdate'

import styles from './index.module.scss'

const ContentUpdate2022 = () => {
  const { t: updates } = useTranslation('updates')

  const versionUpdates = {
    '1.0.0': 5,
  }

  return (
    <>
      <ContentUpdate
        version="2022-12L"
        dateString="2022/12/26"
        event="events.legfest"
        newItems={{
          character: ['3040440000', '3040441000', '3040442000'],
          weapon: ['1040315900', '1040914500', '1040218200'],
          summon: ['2040417000'],
        }}
        numNotes={0}
      />
      <ContentUpdate
        version="2022-12F2"
        dateString="2022/12/26"
        event="events.flash"
        newItems={{
          character: ['3040438000', '3040439000'],
          weapon: ['1040024200', '1040116500'],
        }}
        numNotes={0}
      />
      <section className={styles.version} data-version="1.0">
        <div className={styles.header}>
          <h3>1.0.0</h3>
          <time>2022/12/26</time>
        </div>
        <ul className={styles.list}>
          {[...Array(versionUpdates['1.0.0'])].map((e, i) => (
            <li key={`1.0.0-update-${i}`}>
              {updates(`versions.1.0.0.features.${i}`)}
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

export default ContentUpdate2022
