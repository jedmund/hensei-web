import React from 'react'

import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import ChangelogUnit from '~components/ChangelogUnit'

import './index.scss'

interface Props {}

const UpdatesPage: React.FC<Props> = (props: Props) => {
  const { t: common } = useTranslation('common')

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
      <section className="Version" data-version="1.1">
        <div className="Header">
          <h3>1.1.0</h3>
          <time>2023/02/06</time>
        </div>
        <div className="Contents">
          <section>
            <h2>New features</h2>
            <ul className="Notes">
              <li>
                {image(
                  'Remix parties',
                  `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/updates`,
                  'remix',
                  'jpg'
                )}
                <h3>Remix parties</h3>
                <p>
                  See a team you want to try but don&apos;t have Yatima? Now you
                  can remix teams from other users to showcase substitutes, swap
                  for items you have, or just give it your own flavor.
                </p>
              </li>
              <li>
                {image(
                  'Edit parties without an account',
                  `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/updates`,
                  'unauth',
                  'jpg'
                )}
                <h3>No account editing</h3>
                <p>
                  Now you can edit parties you create later on, even if you
                  don&apos;t make an account. You still won&apos;t have a
                  profile, so make sure to bookmark them!
                </p>
              </li>
              <li>
                {image(
                  'Transcendence',
                  `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/updates`,
                  'transcendence',
                  'jpg'
                )}
                <h3>Transcendence</h3>
                <p>
                  Now you can set the transcendence stage for Eternals and
                  select summons (namely, Bahamut).
                </p>
              </li>
              <li>
                {image(
                  'Shields and Manatura',
                  `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/updates`,
                  'accessories',
                  'jpg'
                )}
                <h3>Shields and Manatura</h3>
                <p>
                  When using Paladin or Manadiver, you can set their respective
                  Shield or Manatura from the button next to the main character.
                </p>
              </li>
              <li>
                {image(
                  'Character Mastery',
                  `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/updates`,
                  'mastery',
                  'jpg'
                )}
                <h3>Character Mastery</h3>
                <p>
                  You can now add individual values for your character&apos;s
                  rings, earrings, and awakenings. Make sure to set your
                  Perpetuity Rings!
                </p>
              </li>
              <li>
                {image(
                  'Updated team mechanics',
                  `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/updates`,
                  'mechanics',
                  'jpg'
                )}
                <h3>Updated team mechanics</h3>
                <p>Sorry, each party is only big enough for one Beelzebub.</p>
              </li>
              <li>
                {image(
                  'R Characters',
                  `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/updates`,
                  'rare',
                  'jpg'
                )}
                <h3>R Characters</h3>
                <p>
                  R Characters have been added to the database for your
                  mem—Proving Grounds compositions.
                </p>
              </li>
              <li>
                {image(
                  'Unique URLs for team tabs',
                  `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/updates`,
                  'urls',
                  'jpg'
                )}
                <h3>Unique URLs for team tabs</h3>
                <p>
                  You can now link to individual tabs directly. The site will do
                  it for you when you copy a URL, or you can append{' '}
                  <code>/characters</code>, <code>/weapons</code> or{' '}
                  <code>/summons</code> manually.
                </p>
              </li>
              <li>
                {image(
                  'Redesigned navigation',
                  `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/updates`,
                  'nav',
                  'jpg'
                )}
                <h3>Redesigned navigation</h3>
                <p>
                  The top-navigation has been slightly redesigned. Click the
                  party name to copy its URL!
                </p>
              </li>
              <li>
                {image(
                  'Update toasts',
                  `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/updates`,
                  'toasts',
                  'jpg'
                )}
                <h3>Update toasts</h3>
                <p>
                  The site will now show an update in the bottom-right corner
                  when new features or content is added.
                </p>
              </li>
            </ul>
          </section>
          <section>
            <h2>Bug fixes</h2>
            <ul className="Bugs">
              <li>
                Fixed a bug that caused users to be logged out whenever they
                restarted their browser
              </li>
              <li>
                Fixed a bug that caused Dark Opus weapons to permanently
                disappear when adding them to a party that already had one
              </li>
            </ul>
          </section>
        </div>
      </section>
      <section className="Content Version" data-version="2022-12L">
        <div className="Header">
          <h3>2023-01 Flash Gala</h3>
          <time>2023/01/19</time>
        </div>
        <div className="Contents">
          <section className="characters">
            <h4>New characters</h4>
            <div className="items">
              <ChangelogUnit name="Amelia" id="3040444000" type="character" />
              <ChangelogUnit
                name="Halluel and Malluel (Grand)"
                id="3040443000"
                type="character"
              />
            </div>
          </section>
          <section className="weapons">
            <h4>New weapons</h4>
            <div className="items">
              <ChangelogUnit
                name="Shining Silver"
                id="1040218300"
                type="weapon"
              />
              <ChangelogUnit
                name="Eternal Signature"
                id="1040116600"
                type="weapon"
              />
            </div>
          </section>
        </div>
      </section>
      <section className="Content Version" data-version="2023-01U">
        <div className="Header">
          <h3>2023-01 Uncap</h3>
          <time>2023/01/06</time>
        </div>
        <div className="Contents">
          <section className="characters">
            <h4>Updated characters</h4>
            <div className="items">
              <ChangelogUnit
                name="Shiva"
                id="3040196000"
                type="character"
                image="03"
              />
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
          <li>Extra party fields: Full Auto, Clear Time, and more</li>
          <li>Support for Youtube short URLs</li>
          <li>Responsive grids and lots of other mobile fixes</li>
          <li>Many other bug fixes</li>
        </ul>
      </section>
      <section className="Content Version" data-version="2022-12L">
        <div className="Header">
          <h3>2022-12 Legend Festival</h3>
          <time>2022/12/26</time>
        </div>
        <div className="Contents">
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
      <section className="Content Version" data-version="2022-12F2">
        <div className="Header">
          <h3>2022-12 Flash Gala</h3>
          <time>2022/12/26</time>
        </div>
        <div className="Contents">
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
      <section className="Version" data-version="1.0">
        <div className="Header">
          <h3>1.0.0</h3>
          <time>2022/12/26</time>
        </div>
        <ul className="Bare Contents">
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
