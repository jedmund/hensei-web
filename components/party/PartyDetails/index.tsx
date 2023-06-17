import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'
import clonedeep from 'lodash.clonedeep'

import Linkify from 'react-linkify'
import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import classNames from 'classnames'
import reactStringReplace from 'react-string-replace'

import Button from '~components/common/Button'
import GridRepCollection from '~components/GridRepCollection'
import GridRep from '~components/GridRep'
import Tooltip from '~components/common/Tooltip'
import TextFieldset from '~components/common/TextFieldset'

import api from '~utils/api'
import { appState, initialAppState } from '~utils/appState'
import { formatTimeAgo } from '~utils/timeAgo'
import { youtube } from '~utils/youtube'

import CheckIcon from '~public/icons/Check.svg'
import CrossIcon from '~public/icons/Cross.svg'
import EllipsisIcon from '~public/icons/Ellipsis.svg'
import EditIcon from '~public/icons/Edit.svg'
import RemixIcon from '~public/icons/Remix.svg'

import type { DetailsObject } from 'types'

import './index.scss'

// Props
interface Props {
  party?: Party
  new: boolean
  editable: boolean
  updateCallback: (details: DetailsObject) => void
}

const PartyDetails = (props: Props) => {
  const { t } = useTranslation('common')
  const router = useRouter()

  const youtubeUrlRegex =
    /(?:https:\/\/www\.youtube\.com\/watch\?v=|https:\/\/youtu\.be\/)([\w-]+)/g

  const descriptionInput = React.createRef<HTMLTextAreaElement>()

  const [open, setOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)

  const [remixes, setRemixes] = useState<Party[]>([])
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

  const [errors, setErrors] = useState<{ [key: string]: string }>({
    name: '',
    description: '',
  })

  useEffect(() => {
    // Extract the video IDs from the description
    if (appState.party.description) {
      const videoIds = extractYoutubeVideoIds(appState.party.description)

      // Fetch the video titles for each ID
      const fetchPromises = videoIds.map(({ id }) => fetchYoutubeData(id))

      // Wait for all the video titles to be fetched
      Promise.all(fetchPromises).then((videoTitles) => {
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

  function handleTextAreaChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    event.preventDefault()

    const { name, value } = event.target
    let newErrors = errors

    setErrors(newErrors)
  }

  async function fetchYoutubeData(videoId: string) {
    return await youtube
      .getVideoById(videoId, { maxResults: 1 })
      .then((data) => data.items[0].snippet.localized.title)
  }

  function toggleDetails() {
    // Enabling this code will make live updates not work,
    // but I'm not sure why it's here, so we're not going to remove it.

    // if (name !== party.name) {
    //   const resetName = party.name ? party.name : ''
    //   setName(resetName)
    //   if (nameInput.current) nameInput.current.value = resetName
    // }
    setOpen(!open)
  }

  function updateDetails(event: React.MouseEvent) {
    const details: DetailsObject = {
      description: descriptionInput.current?.value,
    }

    props.updateCallback(details)
    toggleDetails()
  }

  function handleClick() {
    setAlertOpen(!alertOpen)
  }

  // Methods: Navigation
  function goTo(shortcode?: string) {
    if (shortcode) router.push(`/p/${shortcode}`)
  }

  function extractYoutubeVideoIds(text: string) {
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

  // Methods: Favorites
  function toggleFavorite(teamId: string, favorited: boolean) {
    if (favorited) unsaveFavorite(teamId)
    else saveFavorite(teamId)
  }

  function saveFavorite(teamId: string) {
    api.saveTeam({ id: teamId }).then((response) => {
      if (response.status == 201) {
        const index = remixes.findIndex((p) => p.id === teamId)
        const party = remixes[index]

        party.favorited = true

        let clonedParties = clonedeep(remixes)
        clonedParties[index] = party

        setRemixes(clonedParties)
      }
    })
  }

  function unsaveFavorite(teamId: string) {
    api.unsaveTeam({ id: teamId }).then((response) => {
      if (response.status == 200) {
        const index = remixes.findIndex((p) => p.id === teamId)
        const party = remixes[index]

        party.favorited = false

        let clonedParties = clonedeep(remixes)
        clonedParties[index] = party

        setRemixes(clonedParties)
      }
    })
  }

  function renderRemixes() {
    return remixes.map((party, i) => {
      return (
        <GridRep
          id={party.id}
          shortcode={party.shortcode}
          name={party.name}
          createdAt={new Date(party.created_at)}
          raid={party.raid}
          grid={party.weapons}
          user={party.user}
          favorited={party.favorited}
          fullAuto={party.full_auto}
          autoGuard={party.auto_guard}
          key={`party-${i}`}
          displayUser={true}
          onClick={goTo}
          onSave={toggleFavorite}
        />
      )
    })
  }

  const editable = () => {
    return (
      <section className={editableClasses}>
        <TextFieldset
          fieldName="name"
          placeholder={
            'Write your notes here\n\n\nWatch out for the 50% trigger!\nMake sure to click Fediel’s 3 first\nGood luck with RNG!'
          }
          value={props.party?.description}
          onChange={handleTextAreaChange}
          error={errors.description}
          ref={descriptionInput}
        />

        <div className="bottom">
          <div className="left">
            {router.pathname !== '/new' ? (
              <Button
                leftAccessoryIcon={<CrossIcon />}
                className="Blended medium destructive"
                onClick={handleClick}
                text={t('buttons.delete')}
              />
            ) : (
              ''
            )}
          </div>
          <div className="right">
            <Button text={t('buttons.cancel')} onClick={toggleDetails} />
            <Button
              leftAccessoryIcon={<CheckIcon className="Check" />}
              text={t('buttons.save_info')}
              onClick={updateDetails}
            />
          </div>
        </div>
      </section>
    )
  }

  const readOnly = () => {
    return (
      <section className={readOnlyClasses}>
        <Linkify>{embeddedDescription}</Linkify>
      </section>
    )
  }

  const remixSection = () => {
    return (
      <section className="Remixes">
        <h3>{t('remixes')}</h3>
        {<GridRepCollection>{renderRemixes()}</GridRepCollection>}
      </section>
    )
  }

  return (
    <>
      <section className="DetailsWrapper">
        {readOnly()}
        {editable()}
      </section>
      {remixes && remixes.length > 0 ? remixSection() : ''}
    </>
  )
}

export default PartyDetails
