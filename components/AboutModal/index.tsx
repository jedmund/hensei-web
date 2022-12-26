import React from 'react'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import * as Dialog from '@radix-ui/react-dialog'

import CrossIcon from '~public/icons/Cross.svg'
import ShareIcon from '~public/icons/Share.svg'
import DiscordIcon from '~public/icons/discord.svg'
import GithubIcon from '~public/icons/github.svg'

import './index.scss'

const AboutModal = () => {
  const { t } = useTranslation('common')

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <li className="MenuItem">
          <span>{t('modals.about.title')}</span>
        </li>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="ScrollingOverlay">
          <div className="DialogWrapper">
            <Dialog.Content
              className="About Dialog"
              onOpenAutoFocus={(event) => event.preventDefault()}
            >
              <div className="DialogHeader">
                <Dialog.Title className="DialogTitle">
                  {t('menu.about')}
                </Dialog.Title>
                <Dialog.Close className="DialogClose" asChild>
                  <span>
                    <CrossIcon />
                  </span>
                </Dialog.Close>
              </div>

              <section>
                <Dialog.Description className="DialogDescription">
                  Granblue.team is a tool to save and share team comps for{' '}
                  <a href="https://game.granbluefantasy.jp">
                    Granblue Fantasy.
                  </a>
                </Dialog.Description>
                <Dialog.Description className="DialogDescription">
                  Start adding to a team and a URL will be created for you to
                  share wherever you like, no account needed.
                </Dialog.Description>
                <Dialog.Description className="DialogDescription">
                  However, if you do make an account, you can save any teams you
                  find for future reference and keep all of your teams together
                  in one place.
                </Dialog.Description>
              </section>

              <section>
                <Dialog.Title className="DialogTitle">Feedback</Dialog.Title>
                <Dialog.Description className="DialogDescription">
                  This is an evolving project so feedback and suggestions are
                  greatly appreciated!
                </Dialog.Description>
                <Dialog.Description className="DialogDescription">
                  If you have a feature request, would like to report a bug, or
                  are enjoying the tool and want to say thanks, come hang out in
                  Discord!
                </Dialog.Description>
                <div className="LinkItem">
                  <Link href="https://discord.gg/qyZ5hGdPC8">
                    <a href="https://discord.gg/qyZ5hGdPC8">
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
                <Dialog.Title className="DialogTitle">Credits</Dialog.Title>
                <Dialog.Description className="DialogDescription">
                  Granblue.team was built by{' '}
                  <a href="https://twitter.com/jedmund" target="_blank">
                    @jedmund
                  </a>{' '}
                  with a lot of help from{' '}
                  <a href="https://twitter.com/lalalalinna" target="_blank">
                    @lalalalinna
                  </a>{' '}
                  and{' '}
                  <a href="https://twitter.com/tarngerine" target="_blank">
                    @tarngerine
                  </a>
                  .
                </Dialog.Description>
                <Dialog.Description className="DialogDescription">
                  Many thanks also go to Jif, Slipper, Bless, yoey, 9highwind,
                  and everyone else in{' '}
                  <a
                    href="https://game.granbluefantasy.jp/#guild/detail/1190185"
                    target="_blank"
                  >
                    Fireplace
                  </a>{' '}
                  that helped with bug testing and feature requests. (P.S. We're
                  recruiting!)
                </Dialog.Description>
              </section>

              <section>
                <Dialog.Title className="DialogTitle">
                  Contributing
                </Dialog.Title>
                <Dialog.Description className="DialogDescription">
                  This app is open source and licensed under{' '}
                  <a
                    href="https://choosealicense.com/licenses/agpl-3.0/"
                    target="_blank"
                  >
                    GNU AGPLv3
                  </a>
                  . Plainly, that means you can download the source, modify it,
                  and redistribute it if you attribute this project, use the
                  same license, and keep it open source. You can contribute on
                  Github.
                </Dialog.Description>
                <ul className="Links">
                  <li className="LinkItem">
                    <Link href="https://github.com/jedmund/hensei-api">
                      <a href="https://github.com/jedmund/hensei-api">
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
                      <a href="https://github.com/jedmund/hensei-web">
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
            </Dialog.Content>
          </div>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default AboutModal
