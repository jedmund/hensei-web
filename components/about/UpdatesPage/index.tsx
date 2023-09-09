import React from 'react'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import ContentUpdate from '~components/about/ContentUpdate'
import LinkItem from '../LinkItem'
import DiscordIcon from '~public/icons/discord.svg'

import styles from './index.module.scss'

const UpdatesPage = () => {
  const { t: common } = useTranslation('common')
  const { t: updates } = useTranslation('updates')

  const classes = classNames(styles.updates, 'PageContent')

  const versionUpdates = {
    '1.0.0': 5,
    '1.0.1': 4,
    '1.1.0': {
      updates: 10,
      bugs: 4,
      images: [
        'remix',
        'unauth',
        'transcendence',
        'accessories',
        'mastery',
        'mechanics',
        'rare',
        'urls',
        'nav',
        'toasts',
      ],
    },
    '1.2.0': {
      updates: 10,
      bugs: 0,
      images: [
        'party-peek',
        'party-redesign',
        'visibility',
        'rich-text',
        'mentions',
        'include-exclude',
        'raid-search',
        'search-views',
        'quick-summon',
        'grand-awakening',
      ],
    },
    '202302U2': {
      updates: 1,
    },
    '1.2.1': {
      bugs: 5,
    },
  }

  function image(
    alt: string,
    url: string,
    filename: string,
    extension: string
  ) {
    const fallback = `${url}/${filename}.${extension}`

    let set = []
    for (let i = 1; i < 3; i++) {
      if (i === 1) set.push(fallback)
      else set.push(`${url}/${filename}@${i}x.${extension} ${i}x`)
    }
    const sizes = set.join(', ')

    return <img alt={alt} src={fallback} srcSet={sizes} />
  }

  return (
    <div className={classes}>
      <h1>{common('about.segmented_control.updates')}</h1>
      <ContentUpdate
        version="2023-09U"
        dateString="2023/09/07"
        event="events.content"
        newItems={{
          weapon: ['1040117000', '1040516300'],
        }}
        numNotes={1}
      />
      <section className={styles.version} data-version="1.2.1">
        <div className={styles.header}>
          <h3>1.2.1</h3>
          <time>2023/09/01</time>
        </div>
        <h2>Bug fixes</h2>
        <ul className={styles.bugs}>
          {[...Array(versionUpdates['1.2.1'].bugs)].map((e, i) => (
            <li key={`1.2.1-bugfix-${i}`}>
              {updates(`versions.1.2.1.bugs.${i}`)}
            </li>
          ))}
        </ul>
      </section>
      <ContentUpdate
        version="2023-08L"
        dateString="2023/08/31"
        event="events.legfest"
        newItems={{
          character: ['3040481000', '3040482000'],
          weapon: ['1040218700', '1040617700', '1040712700', '1030406400'],
        }}
      />
      <section className={styles.version} data-version="1.2">
        <div className={styles.header}>
          <h3>1.2.0</h3>
          <time>2023/08/25</time>
        </div>
        <div className={styles.contents}>
          <section>
            <h2>{updates('labels.features')}</h2>
            <ul className={styles.features}>
              {[...Array(versionUpdates['1.2.0'].updates)].map((e, i) => (
                <li key={`1.2.0-update-${i}`}>
                  {image(
                    updates(`versions.1.2.0.features.${i}.title`),
                    `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/updates`,
                    versionUpdates['1.2.0'].images[i],
                    'jpg'
                  )}
                  <h3>{updates(`versions.1.2.0.features.${i}.title`)}</h3>
                  <p>{updates(`versions.1.2.0.features.${i}.blurb`)}</p>
                </li>
              ))}
            </ul>
            <div className={styles.foreword}>
              <h2>Developer notes</h2>
              {updates('versions.1.2.0.notes')
                .split('\n')
                .map((item, i) => (
                  <p key={`note-${i}`}>{item}</p>
                ))}
              <LinkItem
                className="discord constrained update"
                title="granblue-tools"
                link="https://discord.gg/qyZ5hGdPC8"
                icon={<DiscordIcon />}
              />
            </div>
          </section>
          {/* <section>
            <h2>Bug fixes</h2>
            <ul className={styles.bugs}>
              {[...Array(versionUpdates['1.2.0'].bugs)].map((e, i) => (
                <li key={`1.2.0-bugfix-${i}`}>
                  {updates(`versions.1.2.0.bugs.${i}`)}
                </li>
              ))}
            </ul>
          </section> */}
        </div>
      </section>
      <ContentUpdate
        version="2023-08U"
        dateString="2023/08/22"
        event="events.uncap"
        uncappedItems={{
          summon: ['2040185000', '2040225000', '2040205000', '2040261000'],
        }}
      />
      <ContentUpdate
        version="2023-08F"
        dateString="2023/08/16"
        event="events.flash"
        newItems={{
          character: ['3040478000', '3040479000', '3040480000'],
          weapon: ['1040915400', '1040024800', '1040422000'],
          summon: ['2040423000'],
        }}
        uncappedItems={{
          character: ['3040161000', '3040165000'],
        }}
        numNotes={1}
      />
      <ContentUpdate
        version="2023-08U"
        dateString="2023/08/11"
        event="events.content"
        newItems={{
          character: ['3040476000', '3040477000'],
          weapon: ['1040117100'],
          summon: ['2040422000', '2040421000'],
        }}
      />
      <ContentUpdate
        version="2023-07L"
        dateString="2023/07/31"
        event="events.legfest"
        newItems={{
          character: ['3040472000', '3040474000', '3040475000', '3040473000'],
          weapon: [
            '1040815800',
            '1040024700',
            '1040516200',
            '1040218600',
            '1040617600',
            '1030305800',
          ],
          summon: ['2040420000'],
        }}
      />
      <ContentUpdate
        version="2023-07F"
        dateString="2023/07/15"
        event="events.flash"
        newItems={{
          character: ['3040470000', '3040471000'],
          weapon: ['1040316300', '1040516100'],
        }}
      />
      <ContentUpdate
        version="2023-07U"
        dateString="2023/07/08"
        event="events.uncap"
        newItems={{
          weapon: ['1040218500'],
        }}
        uncappedItems={{
          character: ['3040102000'],
        }}
      />
      <ContentUpdate
        version="2023-06L"
        dateString="2023/06/29"
        event="events.legfest"
        newItems={{
          character: ['3040468000', '3040469000'],
          weapon: ['1040421900', '1040712600', '1040516000', '1030305700'],
        }}
      />
      <ContentUpdate
        version="2023-06F"
        dateString="2023/06/19"
        event="events.flash"
        newItems={{
          character: ['3040466000', '3040467000'],
          weapon: ['1040915300', '1040815700'],
        }}
      />
      <ContentUpdate
        version="2023-06U1"
        dateString="2023/06/07"
        event="events.uncap"
        uncappedItems={{
          character: ['3040169000', '3040163000'],
        }}
      />
      <ContentUpdate
        version="2023-05L"
        dateString="2023/05/31"
        event="events.legfest"
        newItems={{
          character: ['3040464000', '3040465000'],
          weapon: ['1040116900', '1040218400', '1040712500', '1030804400'],
        }}
        numNotes={1}
      />
      <ContentUpdate
        version="2023-05F"
        dateString="2023/05/20"
        event="events.flash"
        newItems={{
          character: ['3040463000', '3040462000'],
          weapon: ['1040421800', '1040024600'],
        }}
        numNotes={0}
      />
      <ContentUpdate
        version="2023-05U"
        dateString="2023/05/18"
        event="events.content"
        newItems={{
          weapon: ['1040712400'],
        }}
        uncappedItems={{
          character: ['3040073000'],
        }}
        numNotes={1}
      />
      <ContentUpdate
        version="2023-04L"
        dateString="2023/04/30"
        event="events.legfest"
        newItems={{
          character: ['3040460000', '3040461000'],
          weapon: ['1040815500', '1040815600', '1040421700', '1030208100'],
        }}
        numNotes={0}
      />
      <ContentUpdate
        version="2023-04U"
        dateString="2023/04/01"
        event="events.content"
        newItems={{
          character: ['3040457000'],
          summon: ['2040419000'],
        }}
        numNotes={0}
      />
      <ContentUpdate
        version="2023-03L"
        dateString="2023/03/31"
        event="events.legfest"
        newItems={{
          character: ['3040456000', '3040455000'],
          weapon: ['1040316100', '1040617500'],
        }}
        numNotes={0}
      />
      <ContentUpdate
        version="2023-03U2"
        dateString="2023/03/30"
        event="events.content"
        uncappedItems={{
          character: ['3040164000', '3040160000'],
        }}
        newItems={{
          weapon: [
            '1040815100',
            '1040815200',
            '1040815300',
            '1040815400',
            '1040815000',
            '1040024400',
            '1030609400',
          ],
        }}
        numNotes={1}
      />
      <ContentUpdate
        version="2023-03U"
        dateString="2023/03/22"
        event="events.content"
        newItems={{
          weapon: ['1040024300'],
        }}
        uncappedItems={{
          weapon: [
            '1040217600',
            '1040312800',
            '1040023200',
            '1040217800',
            '1040420800',
            '1040213900',
            '1040116200',
            '1040216500',
            '1040616700',
            '1040420700',
            '1040913000',
            '1040419000',
          ],
          summon: [
            '2040398000',
            '2040413000',
            '2040401000',
            '2040406000',
            '2040418000',
            '2040409000',
            '2040056000',
          ],
        }}
        numNotes={2}
      />
      <ContentUpdate
        version="2023-03F"
        dateString="2023/03/16"
        event="events.flash"
        newItems={{
          character: ['3040451000', '3040452000', '3040453000', '3040454000'],
          weapon: ['1040914600', '1040116800', '1040515900', '1040712300'],
        }}
        numNotes={7}
      />
      <ContentUpdate
        version="2023-02L"
        dateString="2023/02/27"
        event="events.legfest"
        newItems={{
          character: ['3040450000', '3040449000'],
          weapon: ['1040421600', '1040617300', '1040712200'],
          summon: ['2040418000'],
        }}
      />
      <ContentUpdate
        version="2023-02F"
        dateString="2023/02/14"
        event="events.flash"
        newItems={{
          character: ['3040447000', '3040448000'],
          weapon: ['1040617200', '1040421500'],
        }}
      />
      <ContentUpdate
        version="2023-02-U3"
        dateString="2023/02/12"
        event="events.uncap"
        uncappedItems={{
          character: ['3040173000'],
          weapon: ['1040606800', '1040606900', '1040607000', '1040509500'],
          summon: ['2040288000'],
        }}
      />
      <ContentUpdate
        version="2023-02-U2"
        dateString="2023/02/06"
        event="events.uncap"
        newItems={{
          weapon: ['1040016100'],
        }}
        numNotes={versionUpdates['202302U2'].updates}
        uncappedItems={{
          character: ['3040252000'],
          weapon: ['1040617100', '1040016100'],
        }}
      />
      <section className={styles.version} data-version="1.1">
        <div className={styles.header}>
          <h3>1.1.0</h3>
          <time>2023/02/06</time>
        </div>
        <div className={styles.contents}>
          <section>
            <h2>{updates('labels.features')}</h2>
            <ul className={styles.features}>
              {[...Array(versionUpdates['1.1.0'].updates)].map((e, i) => (
                <li key={`1.1.0-update-${i}`}>
                  {image(
                    updates(`versions.1.1.0.features.${i}.title`),
                    `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/updates`,
                    versionUpdates['1.1.0'].images[i],
                    'jpg'
                  )}
                  <h3>{updates(`versions.1.1.0.features.${i}.title`)}</h3>
                  <p>{updates(`versions.1.1.0.features.${i}.blurb`)}</p>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>Bug fixes</h2>
            <ul className={styles.bugs}>
              {[...Array(versionUpdates['1.1.0'].bugs)].map((e, i) => (
                <li key={`1.1.0-bugfix-${i}`}>
                  {updates(`versions.1.1.0.bugs.${i}`)}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
      <ContentUpdate
        version="2023-02-U1"
        dateString="2023/02/01"
        event="events.uncap"
        uncappedItems={{
          character: ['3040136000', '3040219000'],
          weapon: ['1040412800', '1040511300'],
          summon: ['2040234000', '2040331000'],
        }}
      />
      <ContentUpdate
        version="2023-01F"
        dateString="2023/01/31"
        event={'events.legfest'}
        newItems={{
          character: ['3040445000', '3040446000'],
          weapon: ['1040116700', '1040421400', '1040316000', '1030208000'],
        }}
        numNotes={0}
      />
      <ContentUpdate
        version="2023-01F"
        dateString="2023/01/19"
        event="events.flash"
        newItems={{
          character: ['3040444000', '3040443000'],
          weapon: ['1040218300', '1040116600'],
        }}
        numNotes={0}
      />
      <ContentUpdate
        version="2023-01U"
        dateString="2023/01/06"
        event="events.uncap"
        uncappedItems={{
          character: ['3040196000'],
        }}
        numNotes={0}
      />
      <section className={styles.version} data-version="1.0">
        <div className={styles.header}>
          <h3>1.0.1</h3>
          <time>2023/01/08</time>
        </div>
        <ul className={styles.list}>
          {[...Array(versionUpdates['1.0.1'])].map((e, i) => (
            <li key={`1.0.1-update-${i}`}>
              {updates(`versions.1.0.1.features.${i}`)}
            </li>
          ))}
        </ul>
      </section>
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
    </div>
  )
}

export default UpdatesPage
