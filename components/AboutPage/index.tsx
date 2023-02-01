import React from 'react'
import Link from 'next/link'
import { Trans, useTranslation } from 'next-i18next'

import ShareIcon from '~public/icons/Share.svg'
import DiscordIcon from '~public/icons/discord.svg'
import GithubIcon from '~public/icons/github.svg'

import './index.scss'

interface Props {}

const AboutPage: React.FC<Props> = (props: Props) => {
  const { t: common } = useTranslation('common')
  const { t: about } = useTranslation('about')

  return (
    <div className="About PageContent">
      <h1>{common('about.segmented_control.about')}</h1>
      <section>
        <h2>
          <Trans i18nKey="about:about.subtitle">
            Granblue.team is a tool to save and share team compositions for{' '}
            <a
              href="https://game.granbluefantasy.jp"
              target="_blank"
              rel="noreferrer"
            >
              Granblue Fantasy
            </a>
            , a social RPG from Cygames.
          </Trans>
        </h2>
        <p>{about('about.explanation.0')}</p>
        <p>{about('about.explanation.1')}</p>
        <div className="Hero" />
      </section>

      <section>
        <h2>{about('about.feedback.title')}</h2>
        <p>{about('about.feedback.explanation')}</p>
        <p>{about('about.feedback.solicit')}</p>
        <div className="Discord LinkItem">
          <Link href="https://discord.gg/qyZ5hGdPC8">
            <a
              href="https://discord.gg/qyZ5hGdPC8"
              target="_blank"
              rel="noreferrer"
            >
              <div className="Left">
                <DiscordIcon />
                <h3>granblue-tools</h3>
              </div>
              <ShareIcon className="ShareIcon" />
            </a>
          </Link>
        </div>
      </section>

      <section>
        <h2>{about('about.credits.title')}</h2>
        <p>
          <Trans i18nKey="about:about.credits.maintainer">
            Granblue.team was built and is maintained by{' '}
            <a
              href="https://twitter.com/jedmund"
              target="_blank"
              rel="noreferrer"
            >
              @jedmund
            </a>
            .
          </Trans>
        </p>
        <p>
          <Trans i18nKey="about:about.credits.assistance">
            Many thanks to{' '}
            <a
              href="https://twitter.com/lalalalinna"
              target="_blank"
              rel="noreferrer"
            >
              @lalalalinna
            </a>{' '}
            and{' '}
            <a
              href="https://twitter.com/tarngerine"
              target="_blank"
              rel="noreferrer"
            >
              @tarngerine
            </a>
            , who both provided a lot of help and advice as I was ramping up.
          </Trans>
        </p>
        <p>
          <Trans i18nKey="about:about.credits.support">
            Many thanks also go to everyone in{' '}
            <a
              href="https://game.granbluefantasy.jp/#guild/detail/1190185"
              target="_blank"
              rel="noreferrer"
            >
              Fireplace
            </a>{' '}
            and the granblue-tools Discord for all of their help with with bug
            testing, feature requests, and moral support. (P.S. We&apos;re
            recruiting!)
          </Trans>
        </p>
      </section>

      <section>
        <h2>{about('about.contributing.title')}</h2>

        <p>{about('about.contributing.explanation')}</p>
        <ul className="Links">
          <li className="Github LinkItem">
            <Link href="https://github.com/jedmund/hensei-api">
              <a
                href="https://github.com/jedmund/hensei-api"
                target="_blank"
                rel="noreferrer"
              >
                <div className="Left">
                  <GithubIcon />
                  <h3>jedmund/hensei-api</h3>
                </div>
                <ShareIcon className="ShareIcon" />
              </a>
            </Link>
          </li>
          <li className="Github LinkItem">
            <Link href="https://github.com/jedmund/hensei-web">
              <a
                href="https://github.com/jedmund/hensei-web"
                target="_blank"
                rel="noreferrer"
              >
                <div className="Left">
                  <GithubIcon />
                  <h3>jedmund/hensei-web</h3>
                </div>
                <ShareIcon className="ShareIcon" />
              </a>
            </Link>
          </li>
        </ul>
      </section>
      <section>
        <h2>{about('about.license.title')}</h2>
        <p>
          <Trans i18nKey="about:about.license.license">
            This app is licensed under{' '}
            <a
              href="https://choosealicense.com/licenses/agpl-3.0/"
              target="_blank"
              rel="noreferrer"
            >
              GNU AGPLv3
            </a>
            .
          </Trans>
        </p>
        <p>{about('about.license.explanation')}</p>
      </section>
      <section>
        <h2>{about('about.copyright.title')}</h2>
        <p>{about('about.copyright.explanation')}</p>
      </section>
    </div>
  )
}

export default AboutPage
