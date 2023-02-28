import React from 'react'
import { useTranslation } from 'next-i18next'
import ChangelogUnit from '~components/ChangelogUnit'

import './index.scss'

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
  numNotes: number
}
const ContentUpdate = ({
  version,
  dateString,
  event,
  newItems,
  uncappedItems,
  numNotes,
}: Props) => {
  const { t: updates } = useTranslation('updates')

  const date = new Date(dateString)

  function newItemElements(key: 'character' | 'weapon' | 'summon') {
    let elements: React.ReactNode[] = []
    if (newItems && newItems[key]) {
      const items = newItems[key]
      elements = items
        ? items.map((id) => {
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
          <section className={`${key}s`}>
            <h4>{updates(`labels.${key}s`)}</h4>
            <div className="items">{newItemElements(key)}</div>
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
              <ChangelogUnit id={id} type={key} image="03" />
            ) : (
              <ChangelogUnit id={id} type={key} />
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
          <section className={`${key}s`}>
            <h4>{updates(`labels.uncaps.${key}s`)}</h4>
            <div className="items">{uncapItemElements(key)}</div>
          </section>
        ) : (
          ''
        )
    }

    return section
  }

  return (
    <section className="Content Version" data-version={version}>
      <div className="Header">
        <h3>{`${updates('events.date', {
          year: date.getFullYear(),
          month: `${date.getMonth() + 1}`.padStart(2, '0'),
        })}  ${updates(event)}`}</h3>
        <time>{dateString}</time>
      </div>
      <div className="Contents">
        {newItemSection('character')}
        {uncapItemSection('character')}
        {newItemSection('weapon')}
        {uncapItemSection('weapon')}
        {newItemSection('summon')}
        {uncapItemSection('summon')}
      </div>
      {numNotes > 0 ? (
        <div>
          <section>
            <h2>{updates('labels.updates')}</h2>
            <ul className="Bare Contents">
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
