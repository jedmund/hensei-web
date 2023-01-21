import React from 'react'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import {
  Dialog,
  DialogClose,
  DialogTitle,
  DialogTrigger,
} from '~components/Dialog'
import DialogContent from '~components/DialogContent'

import CrossIcon from '~public/icons/Cross.svg'
import ShareIcon from '~public/icons/Share.svg'
import GithubIcon from '~public/icons/github.svg'

import './index.scss'

const RoadmapModal = () => {
  const { t } = useTranslation('roadmap')

  return (
    <Dialog>
      <DialogTrigger asChild>
        <li className="MenuItem">
          <span>{t('modals.roadmap.title')}</span>
        </li>
      </DialogTrigger>
      <DialogContent
        className="Roadmap"
        title={t('title')}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={() => {}}
      >
        <div>
          <section className="notes">
            <p>{t('blurb')}</p>
            <p>{t('link.intro')}</p>
            <div className="LinkItem">
              <Link href="https://github.com/users/jedmund/projects/1/views/3">
                <a
                  href="https://github.com/users/jedmund/projects/1/views/3"
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="Left">
                    <GithubIcon />
                    <h3>{t('link.title')}</h3>
                  </div>
                  <ShareIcon className="ShareIcon" />
                </a>
              </Link>
            </div>
          </section>

          <section className="features">
            <h3 className="priority in_progress">{t('subtitle')}</h3>
            <ul>
              <li>
                <h4>{t('roadmap.item1.title')}</h4>
                <p>{t('roadmap.item1.description')}</p>
              </li>
              <li>
                <h4>{t('roadmap.item2.title')}</h4>
                <p>{t('roadmap.item2.description')}</p>
              </li>
              <li>
                <h4>{t('roadmap.item3.title')}</h4>
                <p>{t('roadmap.item3.description')}</p>
              </li>
              <li>
                <h4>{t('roadmap.item4.title')}</h4>
                <p>{t('roadmap.item4.description')}</p>
              </li>
              <li>
                <h4>{t('roadmap.item5.title')}</h4>
                <p>{t('roadmap.item5.description')}</p>
              </li>
              <li>
                <h4>{t('roadmap.item6.title')}</h4>
                <p>{t('roadmap.item6.description')}</p>
              </li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default RoadmapModal
