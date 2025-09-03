'use client'

import React from 'react'

import { useTranslations } from 'next-intl'
import classNames from 'classnames'

import LinkItem from '~components/about/LinkItem'
import GithubIcon from '~public/icons/github.svg'

import styles from './index.module.scss'

const ROADMAP_ITEMS = 6

const RoadmapPage = () => {
  const common = useTranslations('common')
  const about = useTranslations('about')

  const classes = classNames(styles.roadmap, 'PageContent')

  return (
    <div className={classes}>
      <h1>{common('about.segmented_control.roadmap')}</h1>
      <section className={styles.notes}>
        <p>{about('roadmap.blurb')}</p>
        <p>{about('roadmap.link.intro')}</p>
        <LinkItem
          className="github"
          title={about('roadmap.link.title')}
          link="https://github.com/users/jedmund/projects/1/views/3"
          icon={<GithubIcon />}
        />
      </section>

      <section className={styles.features}>
        <h3
          className={classNames({
            [styles.priority]: true,
            [styles.in_progress]: true,
          })}
        >
          {about('roadmap.subtitle')}
        </h3>
        <ul>
          {[...Array(ROADMAP_ITEMS)].map((e, i) => (
            <li key={`roadmap-${i}`}>
              <h4>{about(`roadmap.items.${i}.title`)}</h4>
              <p>{about(`roadmap.items.${i}.description`)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default RoadmapPage
