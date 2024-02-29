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
        version="2024-02L"
        dateString="2024/02/29"
        event="events.legfest"
        newItems={{
          character: ['3040515000', '3040513000', '3040514000'],
          weapon: [
            '1040025900',
            '1040618500',
            '1040119100',
            '1040025800',
            '1030010200',
          ],
        }}
      />
      <ContentUpdate
        version="2024-02U"
        dateString="2024/02/20"
        event="events.content"
        newItems={{
          weapon: ['1040618400'],
        }}
        raidItems={['dark-rapture-zero']}
        numNotes={3}
      />
      <ContentUpdate
        version="2024-02F"
        dateString="2024/02/14"
        event="events.flash"
        newItems={{
          character: ['3040512000', '3040511000'],
          weapon: ['1040713200', '1040816400'],
        }}
      />
      <ContentUpdate
        version="2024-01U"
        dateString="2024/02/06"
        event="events.uncap"
        uncappedItems={{
          character: ['3040190000'],
        }}
      />
      <ContentUpdate
        version="2024-01L"
        dateString="2024/01/31"
        event="events.legfest"
        newItems={{
          character: ['3040509000', '3040510000'],
          weapon: ['1040025700', '1040422500', '1040317100', '1030406600'],
        }}
        numNotes={1}
      />
      <ContentUpdate
        version="2024-01U3"
        dateString="2024/01/18"
        event="events.content"
        newItems={{
          character: ['3040506000'],
        }}
        uncappedItems={{
          character: ['3040313000'],
        }}
      />
      <ContentUpdate
        version="2024-01F"
        dateString="2024/01/15"
        event="events.flash"
        newItems={{
          character: ['3040508000', '3040507000'],
          weapon: ['1040422400', '1040219000'],
        }}
        transcendedItems={{
          weapon: [
            '1040212600',
            '1040212500',
            '1040310700',
            '1040310600',
            '1040415100',
            '1040415000',
            '1040809500',
            '1040809400',
            '1040911100',
            '1040911000',
            '1040017100',
            '1040017000',
          ],
        }}
      />
      <ContentUpdate
        version="2024-01U2"
        dateString="2024/01/12"
        event="events.content"
        newItems={{
          character: ['3040504000', '3040505000'],
          weapon: ['1040618300'],
          summon: ['2040426000'],
        }}
      />
      <ContentUpdate
        version="2024-01U"
        dateString="2024/01/05"
        event="events.content"
        newItems={{
          weapon: ['1040025400', '1040816300'],
        }}
        uncappedItems={{
          character: ['3040167000', '3040166000'],
        }}
        numNotes={2}
      />
      <ContentUpdate
        version="2023-12L"
        dateString="2023/12/31"
        event="events.legfest"
        newItems={{
          weapon: ['1040119000', '1040618200', '1040317000'],
          character: ['3040502000', '3040501000', '3040503000'],
          summon: ['2040425000'],
        }}
      />
      <ContentUpdate
        version="2023-12F2"
        dateString="2023/12/28"
        event="events.flash"
        newItems={{
          weapon: ['1040218900', '1040618100', '1040025500', '1030305900'],
          character: ['3040499000', '3040500000'],
          summon: ['2040427000'],
        }}
      />
      <ContentUpdate
        version="2023-12U2"
        dateString="2023/12/19"
        event="events.content"
        uncappedItems={{
          weapon: [
            '1040815100',
            '1040815200',
            '1040815300',
            '1040815400',
            '1040815000',
          ],
        }}
        numNotes={2}
      />
      <ContentUpdate
        version="2023-12F"
        dateString="2023/12/17"
        event="events.flash"
        newItems={{
          weapon: ['1040218800', '1040816200'],
          character: ['3040498000', '3040497000'],
        }}
        uncappedItems={{
          weapon: ['1040416500', '1040215000'],
        }}
      />
      <ContentUpdate
        version="2023-12U"
        dateString="2023/12/07"
        event="events.content"
        newItems={{
          weapon: ['1040118000'],
        }}
      />
      <ContentUpdate
        version="2023-11L"
        dateString="2023/11/30"
        event="events.legfest"
        newItems={{
          weapon: ['1040516700', '1040713100', '1040117900', '1030609500'],
          character: ['3040496000', '3040495000'],
        }}
      />
      <ContentUpdate
        version="2023-11F"
        dateString="2023/11/17"
        event="events.flash"
        newItems={{
          weapon: ['1040117800', '1040516600', '1040025300'],
          character: ['3040492000', '3040493000', '3040494000'],
        }}
      />
      <ContentUpdate
        version="2023-11U2"
        dateString="2023/11/14"
        event="events.uncap"
        uncappedItems={{
          character: ['3040212000'],
        }}
      />
      <ContentUpdate
        version="2023-11U"
        dateString="2023/11/09"
        event="events.content"
        newItems={{
          weapon: [
            '1040025200',
            '1040316800',
            '1040316900',
            '1040025100',
            '1040712900',
            '1040713000',
            '1040915900',
            '1040617900',
            '1040618000',
            '1040117700',
            '1040316600',
            '1040316700',
            '1040422300',
            '1040816000',
            '1040816100',
            '1040916000',
            '1040117500',
            '1040117600',
          ],
        }}
        numNotes={1}
      />
      <ContentUpdate
        version="2023-10L"
        dateString="2023/10/31"
        event="events.legfest"
        newItems={{
          weapon: ['1040915800', '1040117400', '1040915700', '1030804500'],
          character: ['3040490000', '3040491000'],
          summon: ['2040424000'],
        }}
      />
      <ContentUpdate
        version="2023-10U"
        dateString="2023/10/23"
        event="events.content"
        newItems={{
          weapon: [
            '1040422200',
            '1040815900',
            '1040316500',
            '1040712800',
            '1040516500',
            '1040915600',
          ],
        }}
        numNotes={1}
      />
      <ContentUpdate
        version="2023-10F"
        dateString="2023/10/18"
        event="events.flash"
        newItems={{
          weapon: ['1040516400', '1040422100', '1040316400'],
          character: ['3040487000', '3040488000', '3040489000'],
        }}
      />
      <ContentUpdate
        version="2023-10U"
        dateString="2023/10/16"
        event="events.uncap"
        uncappedItems={{
          character: ['3040109000', '3040168000', '3040162000'],
        }}
      />
      <ContentUpdate
        version="2023-09L"
        dateString="2023/09/30"
        event="events.legfest"
        newItems={{
          weapon: ['1040915500', '1040617800', '1040117300', '1030406500'],
          character: ['3040485000', '3040484000'],
        }}
      />
      <ContentUpdate
        version="2023-09F"
        dateString="2023/09/15"
        event="events.flash"
        newItems={{
          weapon: ['1040117200', '1040024900'],
          character: ['3040486000', '3040483000'],
        }}
        uncappedItems={{
          character: ['3040064000'],
        }}
        numNotes={1}
      />
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
