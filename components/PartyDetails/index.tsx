import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'

import Linkify from 'react-linkify'
import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import classNames from 'classnames'
import reactStringReplace from 'react-string-replace'
import sanitizeHtml from 'sanitize-html'

import * as AlertDialog from '@radix-ui/react-alert-dialog'

import Button from '~components/Button'
import CharLimitedFieldset from '~components/CharLimitedFieldset'
import RaidDropdown from '~components/RaidDropdown'
import TextFieldset from '~components/TextFieldset'

import { accountState } from '~utils/accountState'
import { appState } from '~utils/appState'
import { formatTimeAgo } from '~utils/timeAgo'

import CheckIcon from '~public/icons/Check.svg'
import CrossIcon from '~public/icons/Cross.svg'
import EditIcon from '~public/icons/Edit.svg'

import './index.scss'
import { youtube } from '~utils/youtube'

// Props
interface Props {
  party?: Party
  new: boolean
  editable: boolean
  updateCallback: (name?: string, description?: string, raid?: Raid) => void
  deleteCallback: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void
}

const PartyDetails = (props: Props) => {
  const { party, raids } = useSnapshot(appState)

  const { t } = useTranslation('common')
  const router = useRouter()
  const locale = router.locale || 'en'

  const nameInput = React.createRef<HTMLInputElement>()
  const descriptionInput = React.createRef<HTMLTextAreaElement>()

  const [open, setOpen] = useState(false)
  const [raidSlug, setRaidSlug] = useState('')
  const [embeddedDescription, setEmbeddedDescription] =
    useState<React.ReactNode>()

  const readOnlyClasses = classNames({
    PartyDetails: true,
    ReadOnly: true,
    Visible: !open,
  })

  const editableClasses = classNames({
    PartyDetails: true,
    Editable: true,
    Visible: open,
  })

  const userClass = classNames({
    user: true,
    empty: !party.user,
  })

  const linkClass = classNames({
    wind: party && party.element == 1,
    fire: party && party.element == 2,
    water: party && party.element == 3,
    earth: party && party.element == 4,
    dark: party && party.element == 5,
    light: party && party.element == 6,
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({
    name: '',
    description: '',
  })

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.preventDefault()

    const { name, value } = event.target
    let newErrors = errors

    setErrors(newErrors)
  }

  function handleTextAreaChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    event.preventDefault()

    const { name, value } = event.target
    let newErrors = errors

    setErrors(newErrors)
  }

  useEffect(() => {
    // Extract the video IDs from the description
    if (appState.party.description) {
      const videoIds = extractYoutubeVideoIds(appState.party.description)

      // Fetch the video titles for each ID
      const fetchPromises = videoIds.map(({ id }) => fetchYoutubeData(id))

      // Wait for all the video titles to be fetched
      Promise.all(fetchPromises).then((videoTitles) => {
        // YouTube regex
        const youtubeUrlRegex =
          /https:\/\/www\.youtube\.com\/watch\?v=([\w-]+)/g
        // Replace the video URLs in the description with LiteYoutubeEmbed elements
        const newDescription = reactStringReplace(
          appState.party.description,
          youtubeUrlRegex,
          (match, i) => (
            <LiteYouTubeEmbed
              key={`${match}-${i}`}
              id={match}
              title={videoTitles[i]}
              wrapperClass="YoutubeWrapper"
              playerClass="PlayerButton"
            />
          )
        )

        // Update the state with the new description
        setEmbeddedDescription(newDescription)
      })
    } else {
      setEmbeddedDescription('')
    }
  }, [appState.party.description])

  async function fetchYoutubeData(videoId: string) {
    return await youtube
      .getVideoById(videoId, { maxResults: 1 })
      .then((data) => data.items[0].snippet.localized.title)
  }

  function toggleDetails() {
    setOpen(!open)
  }

  function receiveRaid(slug?: string) {
    if (slug) setRaidSlug(slug)
  }

  function updateDetails(event: React.MouseEvent) {
    const nameValue = nameInput.current?.value
    const descriptionValue = descriptionInput.current?.value
    const raid = raids.find((raid) => raid.slug === raidSlug)

    props.updateCallback(nameValue, descriptionValue, raid)
    toggleDetails()
  }

  function extractYoutubeVideoIds(text: string) {
    // Create a regular expression to match Youtube URLs in the text
    const youtubeUrlRegex = /https:\/\/www\.youtube\.com\/watch\?v=([\w-]+)/g

    // Initialize an array to store the video IDs
    const videoIds = []

    // Use the regular expression to find all the Youtube URLs in the text
    let match
    while ((match = youtubeUrlRegex.exec(text)) !== null) {
      // Extract the video ID from the URL
      const videoId = match[1]

      // Add the video ID to the array, along with the character position of the URL
      videoIds.push({
        id: videoId,
        url: match[0],
        position: match.index,
      })
    }

    // Return the array of video IDs
    return videoIds
  }

  const userImage = (picture?: string, element?: string) => {
    if (picture && element)
      return (
        <img
          alt={picture}
          className={`profile ${element}`}
          srcSet={`/profile/${picture}.png,
                            /profile/${picture}@2x.png 2x`}
          src={`/profile/${picture}.png`}
        />
      )
    else return <div className="no-user" />
  }

  const userBlock = (username?: string, picture?: string, element?: string) => {
    return (
      <div className={userClass}>
        {userImage(picture, element)}
        {username ? username : t('no_user')}
      </div>
    )
  }

  const renderUserBlock = () => {
    let username, picture, element
    if (accountState.account.authorized && props.new) {
      username = accountState.account.user?.username
      picture = accountState.account.user?.picture
      element = accountState.account.user?.element
    } else if (party.user && !props.new) {
      username = party.user.username
      picture = party.user.avatar.picture
      element = party.user.avatar.element
    }

    if (username && picture && element) {
      return linkedUserBlock(username, picture, element)
    } else if (!props.new) {
      return userBlock()
    }
  }

  const linkedUserBlock = (
    username?: string,
    picture?: string,
    element?: string
  ) => {
    return (
      <div>
        <Link href={`/${username}`} passHref>
          <a className={linkClass}>{userBlock(username, picture, element)}</a>
        </Link>
      </div>
    )
  }

  const linkedRaidBlock = (raid: Raid) => {
    return (
      <div>
        <Link href={`/teams?raid=${raid.slug}`} passHref>
          <a className={`Raid ${linkClass}`}>{raid.name[locale]}</a>
        </Link>
      </div>
    )
  }

  const deleteButton = () => {
    if (party.editable) {
      return (
        <AlertDialog.Root>
          <AlertDialog.Trigger className="Button Blended medium destructive">
            <span className="Accessory">
              <CrossIcon />
            </span>
            <span className="Text">{t('buttons.delete')}</span>
          </AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="Overlay" />
            <AlertDialog.Content className="Dialog">
              <AlertDialog.Title className="DialogTitle">
                {t('modals.delete_team.title')}
              </AlertDialog.Title>
              <AlertDialog.Description className="DialogDescription">
                {t('modals.delete_team.description')}
              </AlertDialog.Description>
              <div className="actions">
                <AlertDialog.Cancel className="Button modal">
                  {t('modals.delete_team.buttons.cancel')}
                </AlertDialog.Cancel>
                <AlertDialog.Action
                  className="Button modal destructive"
                  onClick={(e) => props.deleteCallback(e)}
                >
                  {t('modals.delete_team.buttons.confirm')}
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      )
    } else {
      return ''
    }
  }

  const editable = (
    <section className={editableClasses}>
      <CharLimitedFieldset
        fieldName="name"
        placeholder="Name your team"
        value={props.party?.name}
        limit={50}
        onChange={handleInputChange}
        error={errors.name}
        ref={nameInput}
      />
      <RaidDropdown
        showAllRaidsOption={false}
        currentRaid={props.party?.raid ? props.party?.raid.slug : undefined}
        onChange={receiveRaid}
      />
      <TextFieldset
        fieldName="name"
        placeholder={
          'Write your notes here\n\n\nWatch out for the 50% trigger!\nMake sure to click Fediel’s 1 first\nGood luck with RNG!'
        }
        value={props.party?.description}
        onChange={handleTextAreaChange}
        error={errors.description}
        ref={descriptionInput}
      />

      <div className="bottom">
        <div className="left">
          {router.pathname !== '/new' ? deleteButton() : ''}
        </div>
        <div className="right">
          <Button text={t('buttons.cancel')} onClick={toggleDetails} />
          <Button
            accessoryIcon={<CheckIcon className="Check" />}
            text={t('buttons.save_info')}
            onClick={updateDetails}
          />
        </div>
      </div>
    </section>
  )

  const readOnly = (
    <section className={readOnlyClasses}>
      <Linkify>{embeddedDescription}</Linkify>
    </section>
  )

  return (
    <section className="DetailsWrapper">
      <div className="PartyInfo">
        <div className="Left">
          <h1 className={!party.name ? 'empty' : ''}>
            {party.name ? party.name : 'Untitled'}
          </h1>
          <div className="attribution">
            {renderUserBlock()}
            {party.raid ? linkedRaidBlock(party.raid) : ''}
            {party.created_at != '' ? (
              <time
                className="last-updated"
                dateTime={new Date(party.created_at).toString()}
              >
                {formatTimeAgo(new Date(party.created_at), locale)}
              </time>
            ) : (
              ''
            )}
          </div>
        </div>
        <div className="Right">
          {party.editable ? (
            <Button
              accessoryIcon={<EditIcon />}
              text={t('buttons.show_info')}
              onClick={toggleDetails}
            />
          ) : (
            <div />
          )}
        </div>
      </div>
      {readOnly}
      {editable}
    </section>
  )
}

export default PartyDetails
