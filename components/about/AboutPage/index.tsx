import React from 'react'
import { useTranslations } from 'next-intl'
import classNames from 'classnames'

import LinkItem from '../LinkItem'

import DiscordIcon from '~public/icons/discord.svg'
import GithubIcon from '~public/icons/github.svg'

import styles from './index.module.scss'

interface Props {}

const AboutPage: React.FC<Props> = (props: Props) => {
  const common = useTranslations('common')
  const about = useTranslations('about')

  const classes = classNames(styles.about, 'PageContent')

  return (
    <div className={classes}>
      <h1>{common('about.segmented_control.about')}</h1>
      <section>
        <h2>
          {about.rich('about.subtitle', {
            gameLink: (chunks) => (
              <a
                href="https://game.granbluefantasy.jp"
                target="_blank"
                rel="noreferrer"
              >
                {chunks}
              </a>
            )
          })}
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
          {about.rich('about.credits.maintainer', {
            link: (chunks) => (
              <a
                href="https://twitter.com/jedmund"
                target="_blank"
                rel="noreferrer"
              >
                {chunks}
              </a>
            )
          })}
        </p>
        <p>
          {about.rich('about.credits.assistance', {
            link1: (chunks) => (
              <a
                href="https://twitter.com/lalalalinna"
                target="_blank"
                rel="noreferrer"
              >
                {chunks}
              </a>
            ),
            link2: (chunks) => (
              <a
                href="https://twitter.com/tarngerine"
                target="_blank"
                rel="noreferrer"
              >
                {chunks}
              </a>
            )
          })}
        </p>
        <p>
          {about.rich('about.credits.support', {
            link: (chunks) => (
              <a
                href="https://game.granbluefantasy.jp/#guild/detail/1190185"
                target="_blank"
                rel="noreferrer"
              >
                {chunks}
              </a>
            )
          })}
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
          {about.rich('about.license.license', {
            link: (chunks) => (
              <a
                href="https://choosealicense.com/licenses/agpl-3.0/"
                target="_blank"
                rel="noreferrer"
              >
                {chunks}
              </a>
            )
          })}
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
