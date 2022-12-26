import React from 'react'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import * as Dialog from '@radix-ui/react-dialog'

import CrossIcon from '~public/icons/Cross.svg'
import ShareIcon from '~public/icons/Share.svg'
import DiscordIcon from '~public/icons/discord.svg'
import GithubIcon from '~public/icons/github.svg'

import './index.scss'

const RoadmapModal = () => {
  const { t } = useTranslation('common')

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <li className="MenuItem">
          <span>{t('modals.roadmap.title')}</span>
        </li>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content
          className="Dialog"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="DialogHeader">
            <Dialog.Title className="DialogTitle">
              {t('menu.roadmap')}
            </Dialog.Title>
            <Dialog.Close className="DialogClose" asChild>
              <span>
                <CrossIcon />
              </span>
            </Dialog.Close>
          </div>

          <section>
            <h3 className="priority high">High priority</h3>
            <ul className="notes">
              <li>URL state for team tabs</li>
              <li>
                More team details (Full Auto, Auto Guard, Clear Time) and
                filters
              </li>
              <li>
                Character mods - Rings, Earrings, Perpetuity Rings, Styles
              </li>
            </ul>
          </section>
          <section>
            <h3 className="priority mid">Medium priority</h3>
            <ul className="notes">
              <li>Dark mode improvements for logged out users</li>
              <li>Light Markdown in team details</li>
              <li>Transcendence Steps - Eternals and Bahamut</li>
              <li>Rearrange items in team</li>
              <li>Remove items from team</li>
            </ul>
          </section>
          <section>
            <h3 className="priority low">Low priority</h3>
            <ul className="notes">
              <li>Figure out DNS to simplify URLs to just granblue.team</li>
              <li>Unify About, Changelog, Roadmap</li>
              <li>Add R characters</li>
              <li>Add images for weird units like Aquors</li>
              <li>Character substitutions</li>
              <li>Deeper gbf.wiki integration</li>
            </ul>
          </section>
        </Dialog.Content>
        <Dialog.Overlay className="Overlay" />
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default RoadmapModal
