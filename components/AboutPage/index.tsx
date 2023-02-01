import React from 'react'
import Link from 'next/link'

import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import ShareIcon from '~public/icons/Share.svg'
import DiscordIcon from '~public/icons/discord.svg'
import GithubIcon from '~public/icons/github.svg'

import './index.scss'

interface Props {}

const AboutPage: React.FC<Props> = (props: Props) => {
  const { t: common } = useTranslation('common')
  return (
    <div className="About PageContent">
      <h1>{common('about.segmented_control.about')}</h1>
      <section>
        <h2>
          Granblue.team is a tool to save and share team compositions for{' '}
          <a
            href="https://game.granbluefantasy.jp"
            target="_blank"
            rel="noreferrer"
          >
            Granblue Fantasy
          </a>
          , a social RPG from Cygames.
        </h2>

        <p>
          To get started, all you have to do is add an item to a team and a URL
          will be created for you to share wherever you like, no account needed.
        </p>

        <p>
          If you do make an account, you can save any teams you find for future
          reference and keep all of your teams together in one place.
        </p>

        <div className="Hero" />
      </section>

      <section>
        <h2>Feedback</h2>
        <p>
          If you have a feature request, would like to report a bug, or are
          enjoying the tool and want to say thanks, come hang out in Discord.
        </p>
        <p>Feedback and suggestions are greatly appreciated!</p>
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
        <h2>Credits</h2>
        <p>
          Granblue.team was built and is maintained by{' '}
          <a
            href="https://twitter.com/jedmund"
            target="_blank"
            rel="noreferrer"
          >
            @jedmund
          </a>
          .
        </p>
        <p>
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
        </p>
        <p>
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
        </p>
      </section>

      <section>
        <h2>Contributing</h2>

        <p>
          If you know how to program, this app is completely open-source.
          There&apos;s an abundance of features to build and bugs to fix, so
          help is always greatly appreciated!
        </p>
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
        <h2>License</h2>
        <p>
          This app is licensed under{' '}
          <a
            href="https://choosealicense.com/licenses/agpl-3.0/"
            target="_blank"
            rel="noreferrer"
          >
            GNU AGPLv3
          </a>
          .
        </p>
        <p>
          Plainly, that means you can download the source, modify it, and
          redistribute it as long as you attribute this project, use the same
          license, and keep your derivative work open source as well.
        </p>
      </section>
    </div>
  )
}

export default AboutPage
