import React from 'react'
import Link from 'next/link'
import { Trans, useTranslation } from 'next-i18next'
import classNames from 'classnames'

import LinkItem from '../LinkItem'

import ShareIcon from '~public/icons/Share.svg'
import DiscordIcon from '~public/icons/discord.svg'
import GithubIcon from '~public/icons/github.svg'

import styles from './index.module.scss'

interface Props {}

const AboutPage: React.FC<Props> = (props: Props) => {
  const { t: common } = useTranslation('common')
  const { t: about } = useTranslation('about')

  const classes = classNames(styles.about, 'PageContent')

  return (
    <div className={classes}>
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
        <div className={styles.hero} />
      </section>

      <section>
        <h2>{about('about.feedback.title')}</h2>
        <p>{about('about.feedback.explanation')}</p>
        <p>{about('about.feedback.solicit')}</p>
        <LinkItem
          className="discord constrained"
          title="granblue-tools"
          link="https://discord.gg/qyZ5hGdPC8"
          icon={<DiscordIcon />}
        />
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
        <div className={styles.links}>
          <LinkItem
            className="github constrained"
            title="jedmund/hensei-api"
            link="https://github.com/jedmund/hensei-api"
            icon={<GithubIcon />}
          />
          <LinkItem
            className="github constrained"
            title="jedmund/hensei-web"
            link="https://github.com/jedmund/hensei-web"
            icon={<GithubIcon />}
          />
        </div>
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
