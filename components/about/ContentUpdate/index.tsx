import React from 'react'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import ChangelogUnit from '~components/about/ChangelogUnit'
import styles from './index.module.scss'

interface UpdateObject {
  character?: string[]
  summon?: string[]
  weapon?: string[]
}

interface Props {
  version: string
  dateString: string
  event: string
  newItems?: UpdateObject
  uncappedItems?: UpdateObject
  transcendedItems?: UpdateObject
  awakenedItems?: string[]
  raidItems?: string[]
  numNotes: number
}
const ContentUpdate = ({
  version,
  dateString,
  event,
  newItems,
  uncappedItems,
  transcendedItems,
  awakenedItems,
  raidItems,
  numNotes,
}: Props) => {
  const { t: updates } = useTranslation('updates')

  const date = new Date(dateString)

  function newItemElements(key: 'character' | 'weapon' | 'summon') {
    let elements: React.ReactNode[] = []
    if (newItems && newItems[key]) {
      const items = newItems[key]
      elements = items
        ? items.map((id, i) => {
            return <ChangelogUnit id={id} type={key} key={`${key}-${i}`} />
          })
        : []
    }

    return elements
  }

  function newItemSection(key: 'character' | 'weapon' | 'summon') {
    let section: React.ReactNode = ''

    if (newItems && newItems[key]) {
      const items = newItems[key]
      section =
        items && items.length > 0 ? (
          <section className={styles[`${key}s`]}>
            <h4>{updates(`labels.${key}s`)}</h4>
            <div className={styles.items}>{newItemElements(key)}</div>
          </section>
        ) : (
          ''
        )
    }

    return section
  }

  function uncapItemElements(key: 'character' | 'weapon' | 'summon') {
    let elements: React.ReactNode[] = []
    if (uncappedItems && uncappedItems[key]) {
      const items = uncappedItems[key]
      elements = items
        ? items.map((id) => {
            return key === 'character' ? (
              <ChangelogUnit id={id} type={key} key={id} image="03" />
            ) : (
              <ChangelogUnit id={id} type={key} key={id} />
            )
          })
        : []
    }
    return elements
  }

  function uncapItemSection(key: 'character' | 'weapon' | 'summon') {
    let section: React.ReactNode = ''

    if (uncappedItems && uncappedItems[key]) {
      const items = uncappedItems[key]
      section =
        items && items.length > 0 ? (
          <section className={styles[`${key}s`]}>
            <h4>{updates(`labels.uncaps.${key}s`)}</h4>
            <div className={styles.items}>{uncapItemElements(key)}</div>
          </section>
        ) : (
          ''
        )
    }

    return section
  }

  function transcendItemElements(key: 'character' | 'weapon' | 'summon') {
    let elements: React.ReactNode[] = []
    if (transcendedItems && transcendedItems[key]) {
      const items = transcendedItems[key]
      elements = items
        ? items.map((id) => {
            return key === 'character' || key === 'summon' ? (
              <ChangelogUnit id={id} type={key} key={id} image="04" />
            ) : (
              <ChangelogUnit id={id} type={key} key={id} image="03" />
            )
          })
        : []
    }
    return elements
  }

  function transcendItemSection(key: 'character' | 'weapon' | 'summon') {
    let section: React.ReactNode = ''

    if (transcendedItems && transcendedItems[key]) {
      const items = transcendedItems[key]
      section =
        items && items.length > 0 ? (
          <section className={styles[`${key}s`]}>
            <h4>{updates(`labels.transcends.${key}s`)}</h4>
            <div className={styles.items}>{transcendItemElements(key)}</div>
          </section>
        ) : (
          ''
        )
    }

    return section
  }

  function newRaidSection() {
    let section: React.ReactNode = ''

    if (raidItems) {
      section = raidItems && raidItems.length > 0 && (
        <section className={styles['raids']}>
          <h4>{updates(`labels.raids`)}</h4>
          <div className={styles.items}>{raidItemElements()}</div>
        </section>
      )
    }

    return section
  }

  function awakenedItemElements() {
    let elements: React.ReactNode[] = []
    if (awakenedItems) {
      elements = awakenedItems.map((id) => {
        return <ChangelogUnit id={id} type="weapon" key={id} />
      })
    }
    return elements
  }

  function awakenedItemSection() {
    let section: React.ReactNode = ''

    if (awakenedItems && awakenedItems.length > 0) {
      section = (
        <section className={styles['weapons']}>
          <h4>{updates(`labels.awakened.weapons`)}</h4>
          <div className={styles.items}>{awakenedItemElements()}</div>
        </section>
      )
    }

    return section
  }

  function raidItemElements() {
    let elements: React.ReactNode[] = []

    if (raidItems) {
      elements = raidItems.map((id) => {
        return <ChangelogUnit id={id} type="raid" key={id} />
      })
    }

    return elements
  }

  return (
    <section
      className={classNames({
        [styles.content]: true,
        [styles.version]: true,
      })}
      data-version={version}
    >
      <div className={styles.header}>
        <h3>{`${updates('events.date', {
          year: date.getFullYear(),
          month: `${date.getMonth() + 1}`.padStart(2, '0'),
        })}  ${updates(event)}`}</h3>
        <time>{dateString}</time>
      </div>
      <div className={styles.contents}>
        {newItemSection('character')}
        {uncapItemSection('character')}
        {transcendItemSection('character')}
        {newItemSection('weapon')}
        {uncapItemSection('weapon')}
        {transcendItemSection('weapon')}
        {newItemSection('summon')}
        {uncapItemSection('summon')}
        {transcendItemSection('summon')}
        {awakenedItemSection()}
        {newRaidSection()}
      </div>
      {numNotes > 0 ? (
        <div className={styles.notes}>
          <section>
            <h4>{updates('labels.updates')}</h4>
            <ul className={styles.list}>
              {[...Array(numNotes)].map((e, i) => (
                <li key={`${version}-${i}`}>
                  {updates(`versions.${version}.features.${i}`)}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        ''
      )}
    </section>
  )
}

ContentUpdate.defaultProps = {
  numNotes: 0,
}

export default ContentUpdate
