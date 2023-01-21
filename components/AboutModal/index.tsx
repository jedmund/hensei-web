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
import DiscordIcon from '~public/icons/discord.svg'
import GithubIcon from '~public/icons/github.svg'

import './index.scss'

const AboutModal = () => {
  const { t } = useTranslation('common')

  return (
    <Dialog>
      <DialogTrigger asChild>
        <li className="MenuItem">
          <span>{t('modals.about.title')}</span>
        </li>
      </DialogTrigger>
      <DialogContent
        className="About"
        title={t('menu.about')}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={() => {}}
      >
        <div className="sections">
          <section>
            <p>
              Granblue.team is a tool to save and share team comps for{' '}
              <a
                href="https://game.granbluefantasy.jp"
                target="_blank"
                rel="noreferrer"
              >
                Granblue Fantasy
              </a>
              .
            </p>
            <p>
              Start adding to a team and a URL will be created for you to share
              wherever you like, no account needed.
            </p>
            <p>
              However, if you do make an account, you can save any teams you
              find for future reference and keep all of your teams together in
              one place.
            </p>
          </section>

          <section>
            <h2>Feedback</h2>
            <p>
              This is an evolving project so feedback and suggestions are
              greatly appreciated!
            </p>
            <p>
              If you have a feature request, would like to report a bug, or are
              enjoying the tool and want to say thanks, come hang out in
              Discord!
            </p>
            <div className="LinkItem">
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
            <h2>Credits</h2>
            <p>
              Granblue.team was built by{' '}
              <a
                href="https://twitter.com/jedmund"
                target="_blank"
                rel="noreferrer"
              >
                @jedmund
              </a>{' '}
              with a lot of help from{' '}
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
              .
            </p>
            <p>
              Many thanks also go to Disinfect, Slipper, Jif, Bless, 9highwind,
              and everyone else in{' '}
              <a
                href="https://game.granbluefantasy.jp/#guild/detail/1190185"
                target="_blank"
                rel="noreferrer"
              >
                Fireplace
              </a>{' '}
              that helped with bug testing and feature requests. (P.S.
              We&apos;re recruiting!) And yoey, but he won&apos;t join our crew.
            </p>
          </section>

          <section>
            <h2>Contributing</h2>
            <p>
              This app is open source and licensed under{' '}
              <a
                href="https://choosealicense.com/licenses/agpl-3.0/"
                target="_blank"
                rel="noreferrer"
              >
                GNU AGPLv3
              </a>
              . Plainly, that means you can download the source, modify it, and
              redistribute it if you attribute this project, use the same
              license, and keep it open source. You can contribute on Github.
            </p>
            <ul className="Links">
              <li className="LinkItem">
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
              <li className="LinkItem">
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AboutModal
