import React from 'react'

import { useTranslation } from 'next-i18next'

import ChangelogUnit from '~components/ChangelogUnit'

import './index.scss'

const UpdatesPage = () => {
  const { t: common } = useTranslation('common')
  const { t: updates } = useTranslation('updates')

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
    '202302U2': {
      updates: 1,
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
    <div className="Updates PageContent">
      <h1>{common('about.segmented_control.updates')}</h1>
      <section className="Content Version" data-version="2023-02F">
        <div className="Header">
          <h3>{`${updates('events.date', {
            year: 2023,
            month: 2,
          })}  ${updates('events.flash')}`}</h3>
          <time>2023/02/14</time>
        </div>
        <div className="Contents">
          <section className="characters">
            <h4>{updates('labels.characters')}</h4>
            <div className="items">
              <ChangelogUnit id="3040447000" type="character" />
              <ChangelogUnit id="3040448000" type="character" />
            </div>
          </section>
          <section className="weapons">
            <h4>{updates('labels.weapons')}</h4>
            <div className="items">
              <ChangelogUnit id="1040617200" type="weapon" />
              <ChangelogUnit id="1040421500" type="weapon" />
            </div>
          </section>
        </div>
      </section>
      <section className="Content Version" data-version="2023-02U3">
        <div className="Header">
          <h3>{`${updates('events.date', {
            year: 2023,
            month: 2,
          })}  ${updates('events.uncap')}`}</h3>
          <time>2023/02/12</time>
        </div>
        <div className="Contents">
          <section className="characters">
            <h4>{updates('labels.uncaps.characters')}</h4>
            <div className="items">
              <ChangelogUnit id="3040173000" type="character" image="03" />
            </div>
          </section>
          <section className="weapons">
            <h4>{updates('labels.uncaps.weapons')}</h4>
            <div className="items">
              <ChangelogUnit id="1040606800" type="weapon" />
              <ChangelogUnit id="1040606900" type="weapon" />
              <ChangelogUnit id="1040607000" type="weapon" />
              <ChangelogUnit id="1040509500" type="weapon" />
            </div>
          </section>
          <section className="summons">
            <h4>{updates('labels.uncaps.summons')}</h4>
            <div className="items">
              <ChangelogUnit id="2040288000" type="summon" />
            </div>
          </section>
        </div>
      </section>
      <section className="Content Version" data-version="2023-02U2">
        <div className="Header">
          <h3>{`${updates('events.date', {
            year: 2023,
            month: 2,
          })}  ${updates('events.uncap')}`}</h3>
          <time>2023/02/06</time>
        </div>
        <div className="Contents">
          <section className="characters">
            <h4>{updates('labels.uncaps.characters')}</h4>
            <div className="items">
              <ChangelogUnit id="3040252000" type="character" image="03" />
            </div>
          </section>
          <section className="weapons">
            <h4>{updates('labels.uncaps.weapons')}</h4>
            <div className="items">
              <ChangelogUnit id="1040016100" type="weapon" />
            </div>
          </section>
          <section className="weapons">
            <h4>{updates('labels.weapons')}</h4>
            <div className="items">
              <ChangelogUnit id="1040617100" type="weapon" />
            </div>
          </section>
        </div>
        <div>
          <section>
            <h2>{updates('labels.updates')}</h2>
            <ul className="Bare Contents">
              {[...Array(versionUpdates['202302U2'])].map((e, i) => (
                <li key={`2023-02-U2-${i}`}>
                  {updates(`versions.2023-02-U2.features.${i}`)}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
      <section className="Version" data-version="1.1">
        <div className="Header">
          <h3>1.1.0</h3>
          <time>2023/02/06</time>
        </div>
        <div className="Contents">
          <section>
            <h2>{updates('labels.features')}</h2>
            <ul className="Notes">
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
            <ul className="Bugs">
              {[...Array(versionUpdates['1.1.0'].bugs)].map((e, i) => (
                <li key={`1.1.0-bugfix-${i}`}>
                  {updates(`versions.1.1.0.bugs.${i}`)}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
      <section className="Content Version" data-version="2023-02U">
        <div className="Header">
          <h3>{`${updates('events.date', {
            year: 2023,
            month: 2,
          })}  ${updates('events.uncap')}`}</h3>
          <time>2023/02/01</time>
        </div>
        <div className="Contents">
          <section className="characters">
            <h4>{updates('labels.uncaps.characters')}</h4>
            <div className="items">
              <ChangelogUnit id="3040136000" type="character" />
              <ChangelogUnit id="3040219000" type="character" />
            </div>
          </section>
          <section className="weapons">
            <h4>{updates('labels.uncaps.weapons')}</h4>
            <div className="items">
              <ChangelogUnit id="1040511300" type="weapon" />
              <ChangelogUnit id="1040412800" type="weapon" />
            </div>
          </section>
          <section className="summons">
            <h4>{updates('labels.uncaps.summons')}</h4>
            <div className="items">
              <ChangelogUnit id="2040234000" type="summon" />
              <ChangelogUnit id="2040331000" type="summon" />
            </div>
          </section>
        </div>
      </section>
      <section className="Content Version" data-version="2023-01F">
        <div className="Header">
          <h3>{`${updates('events.date', {
            year: 2023,
            month: 1,
          })}  ${updates('events.legfest')}`}</h3>
          <time>2023/01/31</time>
        </div>
        <div className="Contents">
          <section className="characters">
            <h4>{updates('labels.characters')}</h4>
            <div className="items">
              <ChangelogUnit id="3040445000" type="character" />
              <ChangelogUnit id="3040446000" type="character" />
            </div>
          </section>
          <section className="weapons">
            <h4>{updates('labels.weapons')}</h4>
            <div className="items">
              <ChangelogUnit id="1040116700" type="weapon" />
              <ChangelogUnit id="1040421400" type="weapon" />
              <ChangelogUnit id="1040316000" type="weapon" />
              <ChangelogUnit id="1030208000" type="weapon" />
            </div>
          </section>
        </div>
      </section>
      <section className="Content Version" data-version="2023-01F">
        <div className="Header">
          <h3>{`${updates('events.date', {
            year: 2023,
            month: 1,
          })}  ${updates('events.flash')}`}</h3>
          <time>2023/01/19</time>
        </div>
        <div className="Contents">
          <section className="characters">
            <h4>{updates('labels.characters')}</h4>
            <div className="items">
              <ChangelogUnit id="3040444000" type="character" />
              <ChangelogUnit id="3040443000" type="character" />
            </div>
          </section>
          <section className="weapons">
            <h4>{updates('labels.weapons')}</h4>
            <div className="items">
              <ChangelogUnit id="1040218300" type="weapon" />
              <ChangelogUnit id="1040116600" type="weapon" />
            </div>
          </section>
        </div>
      </section>
      <section className="Content Version" data-version="2023-01U">
        <div className="Header">
          <h3>{`${updates('events.date', {
            year: 2023,
            month: 1,
          })}  ${updates('events.uncap')}`}</h3>
          <time>2023/01/06</time>
        </div>
        <div className="Contents">
          <section className="characters">
            <h4>{updates('labels.uncaps.characters')}</h4>
            <div className="items">
              <ChangelogUnit id="3040196000" type="character" image="03" />
            </div>
          </section>
        </div>
      </section>
      <section className="Version" data-version="1.0">
        <div className="Header">
          <h3>1.0.1</h3>
          <time>2023/01/08</time>
        </div>
        <ul className="Bare Contents">
          {[...Array(versionUpdates['1.0.1'])].map((e, i) => (
            <li key={`1.0.1-update-${i}`}>
              {updates(`versions.1.0.1.features.${i}`)}
            </li>
          ))}
        </ul>
      </section>
      <section className="Content Version" data-version="2022-12L">
        <div className="Header">
          <h3>{`${updates('events.date', { year: 2022, month: 12 })} ${updates(
            'events.legfest'
          )}`}</h3>
          <time>2022/12/26</time>
        </div>
        <div className="Contents">
          <section className="characters">
            <h4>{updates('labels.characters')}</h4>
            <div className="items">
              <ChangelogUnit id="3040440000" type="character" />
              <ChangelogUnit id="3040441000" type="character" />
              <ChangelogUnit id="3040442000" type="character" />
            </div>
          </section>
          <section className="weapons">
            <h4>{updates('labels.weapons')}</h4>
            <div className="items">
              <ChangelogUnit id="1040315900" type="weapon" />
              <ChangelogUnit id="1040914500" type="weapon" />
              <ChangelogUnit id="1040218200" type="weapon" />
            </div>
          </section>
          <section className="summons">
            <h4>{updates('labels.summons')}</h4>
            <div className="items">
              <ChangelogUnit id="2040417000" type="summon" />
            </div>
          </section>
        </div>
      </section>
      <section className="Content Version" data-version="2022-12F2">
        <div className="Header">
          <h3>{`${updates('events.date', { year: 2022, month: 12 })} ${updates(
            'events.flash'
          )}`}</h3>
          <time>2022/12/26</time>
        </div>
        <div className="Contents">
          <section className="characters">
            <h4>{updates('labels.characters')}</h4>
            <div className="items">
              <ChangelogUnit id="3040438000" type="character" />
              <ChangelogUnit id="3040439000" type="character" />
            </div>
          </section>
          <section className="weapons">
            <h4>{updates('labels.weapons')}</h4>
            <div className="items">
              <ChangelogUnit id="1040024200" type="weapon" />
              <ChangelogUnit id="1040116500" type="weapon" />
            </div>
          </section>
        </div>
      </section>
      <section className="Version" data-version="1.0">
        <div className="Header">
          <h3>1.0.0</h3>
          <time>2022/12/26</time>
        </div>
        <ul className="Bare Contents">
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
