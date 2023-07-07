import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'
import clonedeep from 'lodash.clonedeep'
import DOMPurify from 'dompurify'

import Button from '~components/common/Button'
import SegmentedControl from '~components/common/SegmentedControl'
import Segment from '~components/common/Segment'
import GridRepCollection from '~components/GridRepCollection'
import GridRep from '~components/GridRep'
import RemixTeamAlert from '~components/dialogs/RemixTeamAlert'
import RemixedToast from '~components/toasts/RemixedToast'
import EditPartyModal from '../EditPartyModal'

import api from '~utils/api'
import { appState } from '~utils/appState'

import type { DetailsObject } from 'types'

import RemixIcon from '~public/icons/Remix.svg'
import EditIcon from '~public/icons/Edit.svg'
import styles from './index.module.scss'
import Editor from '~components/common/Editor'

// Props
interface Props {
  party?: Party
  new: boolean
  editable: boolean
  raidGroups: RaidGroup[]
  remixCallback: () => void
  updateCallback: (details: DetailsObject) => Promise<any>
}

const PartyFooter = (props: Props) => {
  const { t } = useTranslation('common')
  const router = useRouter()

  const { party } = useSnapshot(appState)

  // State: Component
  const [currentSegment, setCurrentSegment] = useState(0)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [remixAlertOpen, setRemixAlertOpen] = useState(false)
  const [remixToastOpen, setRemixToastOpen] = useState(false)

  // State: Data
  const [remixes, setRemixes] = useState<Party[]>([])
  const [sanitizedDescription, setSanitizedDescription] = useState('')

  useEffect(() => {
    if (party.description) {
      const purified = DOMPurify.sanitize(party.description)
      setSanitizedDescription(purified)
    } else {
      setSanitizedDescription('')
    }
  }, [party.description])

  // Methods: Navigation
  function goTo(shortcode?: string) {
    if (shortcode) router.push(`/p/${shortcode}`)
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

        party.social.favorited = true

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

        party.social.favorited = false

        let clonedParties = clonedeep(remixes)
        clonedParties[index] = party

        setRemixes(clonedParties)
      }
    })
  }

  // Actions: Edit info
  function handleDetailsOpenChange(open: boolean) {
    setDetailsOpen(open)
  }

  // Actions: Remix team
  function remixTeamCallback() {
    setRemixToastOpen(true)
    props.remixCallback()
  }

  // Alerts: Remix team
  function openRemixTeamAlert() {
    setRemixAlertOpen(true)
  }

  function handleRemixTeamAlertChange(open: boolean) {
    setRemixAlertOpen(open)
  }

  // Toasts: Remix team
  function handleRemixToastOpenChanged(open: boolean) {
    setRemixToastOpen(!open)
  }

  function handleRemixToastCloseClicked() {
    setRemixToastOpen(false)
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
        {t('footer.remixes.label', {
          count: party?.social.remixes?.length ?? 0,
        })}
      </Segment>
    </SegmentedControl>
  )

  const descriptionSection = (
    <>
      {props.party &&
        props.party.description &&
        props.party.description.length > 0 && (
          <Editor
            content={props.party.description}
            key={props.party?.shortcode}
          />
        )}
      {(!party || !party.description) && (
        <section className={styles.noDescription}>
          <h3>{t('footer.description.empty')}</h3>
          {props.editable && (
            <EditPartyModal
              open={detailsOpen}
              party={props.party}
              raidGroups={props.raidGroups}
              onOpenChange={handleDetailsOpenChange}
              updateParty={props.updateCallback}
            >
              <Button
                leftAccessoryIcon={<EditIcon />}
                text={t('buttons.show_info')}
              />
            </EditPartyModal>
          )}
        </section>
      )}
    </>
  )

  const remixesSection = (
    <section className={styles.remixes}>
      {party?.social.remixes?.length > 0 && (
        <GridRepCollection>{renderRemixes()}</GridRepCollection>
      )}
      {party?.social.remixes?.length === 0 && (
        <div className={styles.noRemixes}>
          <h3>{t('footer.remixes.empty')}</h3>
          <Button
            leftAccessoryIcon={<RemixIcon />}
            text={t('buttons.remix')}
            onClick={openRemixTeamAlert}
          />
        </div>
      )}
    </section>
  )

  function renderRemixes() {
    return party?.social.remixes.map((party, i) => {
      return (
        <GridRep
          id={party.id}
          shortcode={party.shortcode}
          name={party.name}
          createdAt={new Date(party.timestamps.createdAt)}
          raid={party.raid}
          weapons={party.grid.weapons}
          user={party.user}
          favorited={party.social.favorited}
          fullAuto={party.details.fullAuto}
          autoGuard={party.details.autoGuard}
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

      <RemixTeamAlert
        creator={props.editable}
        name={party.name ? party.name : t('no_title')}
        open={remixAlertOpen}
        onOpenChange={handleRemixTeamAlertChange}
        remixCallback={remixTeamCallback}
      />

      <RemixedToast
        open={remixToastOpen}
        partyName={props.party?.name || t('no_title')}
        onOpenChange={handleRemixToastOpenChanged}
        onCloseClick={handleRemixToastCloseClicked}
      />
    </>
  )
}

export default PartyFooter
