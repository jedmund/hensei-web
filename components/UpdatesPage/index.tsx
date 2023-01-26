import React from 'react'

import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import ChangelogUnit from '~components/ChangelogUnit'

import './index.scss'

interface Props {}

const UpdatesPage: React.FC<Props> = (props: Props) => {
  const { t: common } = useTranslation('common')
  return (
    <div className="Updates PageContent">
      <h1>{common('about.segmented_control.updates')}</h1>
      <section className="version" data-version="1.0">
        <div className="top">
          <h3>1.0.1</h3>
          <time>2023/01/08</time>
        </div>
        <ul className="notes">
          <li>Extra party fields: Full Auto, Clear Time, and more</li>
          <li>Support for Youtube short URLs</li>
          <li>Responsive grids and lots of other mobile fixes</li>
          <li>Many other bug fixes</li>
        </ul>
      </section>
      <section className="content version" data-version="2022-12L">
        <div className="top">
          <h3>2022-12 Legend Festival</h3>
          <time>2022/12/26</time>
        </div>
        <div className="update">
          <section className="characters">
            <h4>New characters</h4>
            <div className="items">
              <ChangelogUnit
                name="Michael (Grand)"
                id="3040440000"
                type="character"
              />
              <ChangelogUnit name="Makura" id="3040441000" type="character" />
              <ChangelogUnit
                name="Ultimate Friday"
                id="3040442000"
                type="character"
              />
            </div>
          </section>
          <section className="weapons">
            <h4>New weapons</h4>
            <div className="items">
              <ChangelogUnit
                name="Crimson Scale"
                id="1040315900"
                type="weapon"
              />
              <ChangelogUnit name="Leporidius" id="1040914500" type="weapon" />
              <ChangelogUnit name="FRIED Spear" id="1040218200" type="weapon" />
            </div>
          </section>
          <section className="summons">
            <h4>New summons</h4>
            <div className="items">
              <ChangelogUnit name="Yatima" id="2040417000" type="summon" />
            </div>
          </section>
        </div>
      </section>
      <section className="content version" data-version="2022-12F2">
        <div className="top">
          <h3>2022-12 Flash Gala</h3>
          <time>2022/12/26</time>
        </div>
        <div className="update">
          <section className="characters">
            <h4>New characters</h4>
            <div className="items">
              <ChangelogUnit
                name="Charlotta (Grand)"
                id="3040438000"
                type="character"
              />
              <ChangelogUnit name="Erin" id="3040439000" type="character" />
            </div>
          </section>
          <section className="weapons">
            <h4>New weapons</h4>
            <div className="items">
              <ChangelogUnit
                name="Claíomh Solais Díon"
                id="1040024200"
                type="weapon"
              />
              <ChangelogUnit
                name="Crystal Edge"
                id="1040116500"
                type="weapon"
              />
            </div>
          </section>
        </div>
      </section>
      <section className="version" data-version="1.0">
        <div className="top">
          <h3>1.0.0</h3>
          <time>2022/12/26</time>
        </div>
        <ul className="notes">
          <li>First release!</li>
          <li>You can embed Youtube videos now</li>
          <li>Better clicking - right-click and open in a new tab</li>
          <li>Manually set dark mode in Account Settings</li>
          <li>Lots of bugs squashed</li>
        </ul>
      </section>
    </div>
  )
}

export default UpdatesPage
