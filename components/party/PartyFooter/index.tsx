import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'
import clonedeep from 'lodash.clonedeep'

import Linkify from 'react-linkify'
import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import reactStringReplace from 'react-string-replace'

import Button from '~components/common/Button'
import SegmentedControl from '~components/common/SegmentedControl'
import Segment from '~components/common/Segment'
import GridRepCollection from '~components/GridRepCollection'
import GridRep from '~components/GridRep'

import api from '~utils/api'
import { appState } from '~utils/appState'
import { youtube } from '~utils/youtube'

import type { DetailsObject } from 'types'

import RemixIcon from '~public/icons/Remix.svg'
import EditIcon from '~public/icons/Edit.svg'
import styles from './index.module.scss'

// Props
interface Props {
  party?: Party
  new: boolean
  editable: boolean
  updateCallback: (details: DetailsObject) => void
}

const PartyFooter = (props: Props) => {
  const { t } = useTranslation('common')
  const router = useRouter()

  const { party } = useSnapshot(appState)

  const youtubeUrlRegex =
    /(?:https:\/\/www\.youtube\.com\/watch\?v=|https:\/\/youtu\.be\/)([\w-]+)/g

  // State: UI
  const [currentSegment, setCurrentSegment] = useState(0)

  // State: Data
  const [remixes, setRemixes] = useState<Party[]>([])
  const [embeddedDescription, setEmbeddedDescription] =
    useState<React.ReactNode>()

  useEffect(() => {
    // Extract the video IDs from the description
    if (party.description) {
      const videoIds = extractYoutubeVideoIds(party.description)

      // Fetch the video titles for each ID
      const fetchPromises = videoIds.map(({ id }) => fetchYoutubeData(id))

      // Wait for all the video titles to be fetched
      Promise.all(fetchPromises).then((videoTitles) => {
        // Replace the video URLs in the description with LiteYoutubeEmbed elements
        const newDescription = reactStringReplace(
          party.description,
          youtubeUrlRegex,
          (match, i) => (
            <LiteYouTubeEmbed
              key={`${match}-${i}`}
              id={match}
              title={videoTitles[i]}
              wrapperClass={styles.youtube}
              playerClass={styles.playerButton}
            />
          )
        )

        // Update the state with the new description
        setEmbeddedDescription(newDescription)
      })
    } else {
      setEmbeddedDescription('')
    }
  }, [party.description])

  async function fetchYoutubeData(videoId: string) {
    return await youtube
      .getVideoById(videoId, { maxResults: 1 })
      .then((data) => data.items[0].snippet.localized.title)
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

  const segmentedControl = (
    <SegmentedControl className="background">
      <Segment
        name="description"
        groupName="footer"
        selected={currentSegment === 0}
        onClick={() => setCurrentSegment(0)}
      >
        {t('footer.description.label')}
      </Segment>
      <Segment
        name="remixes"
        groupName="footer"
        selected={currentSegment === 1}
        onClick={() => setCurrentSegment(1)}
      >
        {t('footer.remixes.label', { count: party?.remixes?.length })}
      </Segment>
    </SegmentedControl>
  )

  const descriptionSection = (
    <section className={styles.description}>
      {party && party.description && party.description.length > 0 && (
        <Linkify>{embeddedDescription}</Linkify>
      )}
      {(!party || !party.description) && (
        <div className={styles.noDescription}>
          <h3>{t('footer.description.empty')}</h3>
          {props.editable && (
            <Button
              leftAccessoryIcon={<EditIcon />}
              text={t('buttons.show_info')}
            />
          )}
        </div>
      )}
    </section>
  )

  const remixesSection = (
    <section className={styles.remixes}>
      {party?.remixes?.length > 0 && (
        <GridRepCollection>{renderRemixes()}</GridRepCollection>
      )}
      {party?.remixes?.length === 0 && (
        <div className={styles.noRemixes}>
          <h3>{t('footer.remixes.empty')}</h3>
          <Button leftAccessoryIcon={<RemixIcon />} text={t('buttons.remix')} />
        </div>
      )}
    </section>
  )

  function renderRemixes() {
    return party?.remixes.map((party, i) => {
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
          onClick={goTo}
          onSave={toggleFavorite}
        />
      )
    })
  }

  return (
    <>
      <div className={styles.wrapper}>
        {segmentedControl}
        {currentSegment === 0 && descriptionSection}
        {currentSegment === 1 && remixesSection}
      </div>
    </>
  )
}

export default PartyFooter
