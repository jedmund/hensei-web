'use client'

import React, { useState } from 'react'
import { Link } from '~/i18n/navigation'
import { useRouter, usePathname } from '~/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { getCookie } from 'cookies-next'
import { useSnapshot } from 'valtio'
import { useTranslations } from 'next-intl'
import classNames from 'classnames'

import Button from '~components/common/Button'
import Tooltip from '~components/common/Tooltip'
import Token from '~components/common/Token'

import EditPartyModal from '~components/party/EditPartyModal'
import PartyDropdown from '~components/party/PartyDropdown'

import api from '~utils/api'
import { accountState } from '~utils/accountState'
import { appState, initialAppState } from '~utils/appState'
import { formatTimeAgo } from '~utils/timeAgo'

import RemixTeamAlert from '~components/dialogs/RemixTeamAlert'
import RemixedToast from '~components/toasts/RemixedToast'
import PartyVisibilityDialog from '~components/party/PartyVisibilityDialog'
import UrlCopiedToast from '~components/toasts/UrlCopiedToast'

import EditIcon from '~public/icons/Edit.svg'
import RemixIcon from '~public/icons/Remix.svg'
import SaveIcon from '~public/icons/Save.svg'
import PrivateIcon from '~public/icons/Private.svg'
import UnlistedIcon from '~public/icons/Unlisted.svg'

import type { DetailsObject } from '~types'

import styles from './index.module.scss'


// Props
interface Props {
  party?: Party
  new: boolean
  editable: boolean
  raidGroups: RaidGroup[]
  deleteCallback: () => void
  remixCallback: () => void
  updateCallback: (details: DetailsObject) => Promise<any>
}

const PartyHeader = (props: Props) => {
  const { party } = useSnapshot(appState)

  const t = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const locale = getCookie('NEXT_LOCALE') || 'en'

  const { party: partySnapshot } = useSnapshot(appState)

  // State: Component
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [copyToastOpen, setCopyToastOpen] = useState(false)
  const [remixAlertOpen, setRemixAlertOpen] = useState(false)
  const [remixToastOpen, setRemixToastOpen] = useState(false)
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false)

  const userClass = classNames({
    [styles.user]: true,
    [styles.empty]: !party.user,
  })

  const linkClass = classNames({
    wind: party && party.element == 1,
    fire: party && party.element == 2,
    water: party && party.element == 3,
    earth: party && party.element == 4,
    dark: party && party.element == 5,
    light: party && party.element == 6,
  })

  // Actions: Favorites
  function toggleFavorite() {
    if (appState.party.favorited) unsaveFavorite()
    else saveFavorite()
  }

  function saveFavorite() {
    if (appState.party.id)
      api.saveTeam({ id: appState.party.id }).then((response) => {
        if (response.status == 201) appState.party.favorited = true
      })
    else console.error('Failed to save team: No party ID')
  }

  function unsaveFavorite() {
    if (appState.party.id)
      api.unsaveTeam({ id: appState.party.id }).then((response) => {
        if (response.status == 200) appState.party.favorited = false
      })
    else console.error('Failed to unsave team: No party ID')
  }

  // Methods: Navigation
  function goTo(shortcode?: string) {
    if (shortcode) router.push(`/p/${shortcode}`)
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
    else
      return (
        <img
          alt={t('no_user')}
          className={`profile anonymous`}
          srcSet={`/profile/npc.png,
                            /profile/npc@2x.png 2x`}
          src={`/profile/npc.png`}
        />
      )
  }

  // Actions: Edit info
  function handleDetailsOpenChange(open: boolean) {
    setDetailsOpen(open)
  }

  // Dialogs: Visibility
  function visibilityDialogCallback() {
    setVisibilityDialogOpen(true)
  }

  function handleVisibilityDialogChange(open: boolean) {
    setVisibilityDialogOpen(open)
  }

  // Actions: Remix team
  function remixTeamCallback() {
    setRemixToastOpen(true)
    props.remixCallback()
  }

  // Actions: Copy URL
  function copyToClipboard() {
    if (pathname.split('/')[1] === 'p') {
      navigator.clipboard.writeText(window.location.href)
      setCopyToastOpen(true)
    }
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

  // Toasts / Copy URL
  function handleCopyToastOpenChanged(open: boolean) {
    setCopyToastOpen(!open)
  }

  function handleCopyToastCloseClicked() {
    setCopyToastOpen(false)
  }

  // Rendering

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
      picture = accountState.account.user?.avatar.picture
      element = accountState.account.user?.avatar.element
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
        <Link legacyBehavior href={`/${username}`} passHref>
          <a className={linkClass}>{userBlock(username, picture, element)}</a>
        </Link>
      </div>
    )
  }

  const linkedRaidBlock = (raid: Raid) => {
    return (
      <div>
        <Link legacyBehavior href={`/teams?raid=${raid.slug}`} passHref>
          <a className={`Raid ${linkClass}`}>{raid.name[locale]}</a>
        </Link>
      </div>
    )
  }

  // Render: Tokens
  const chargeAttackToken = (
    <Token active={party.chargeAttack} className="chargeAttack">
      {`${t('party.details.labels.charge_attack')} ${
        party.chargeAttack ? 'On' : 'Off'
      }`}
    </Token>
  )

  const fullAutoToken = (
    <Token active={party.fullAuto} className="fullAuto">
      {`${t('party.details.labels.full_auto')} ${
        party.fullAuto ? 'On' : 'Off'
      }`}
    </Token>
  )

  const autoGuardToken = (
    <Token active={party.autoGuard} className="autoGuard">
      {`${t('party.details.labels.auto_guard')} ${
        party.autoGuard ? 'On' : 'Off'
      }`}
    </Token>
  )

  const autoSummonToken = (
    <Token active={party.autoSummon} className="autoSummon">
      {`${t('party.details.labels.auto_summon')} ${
        party.autoSummon ? 'On' : 'Off'
      }`}
    </Token>
  )

  const turnCountToken = (
    <Token>
      {t('party.details.turns.with_count', {
        count: party.turnCount,
      })}
    </Token>
  )

  const buttonChainToken = () => {
    if (party.buttonCount !== undefined || party.chainCount !== undefined) {
      let string = ''

      if (party.buttonCount !== undefined) {
        string += `${party.buttonCount}b`
      }

      if (party.buttonCount === undefined && party.chainCount !== undefined) {
        string += `0${t('party.details.suffix.buttons')}${party.chainCount}${t(
          'party.details.suffix.chains'
        )}`
      } else if (
        party.buttonCount !== undefined &&
        party.chainCount !== undefined
      ) {
        string += `${party.chainCount}${t('party.details.suffix.chains')}`
      } else if (
        party.buttonCount !== undefined &&
        party.chainCount === undefined
      ) {
        string += `0${t('party.details.suffix.chains')}`
      }

      return <Token>{string}</Token>
    }
  }

  const clearTimeToken = () => {
    const minutes = Math.floor(party.clearTime / 60)
    const seconds = party.clearTime - minutes * 60

    let string = ''
    if (minutes > 0)
      string = `${minutes}${t('party.details.suffix.minutes')} ${seconds}${t(
        'party.details.suffix.seconds'
      )}`
    else string = `${seconds}${t('party.details.suffix.seconds')}`

    return <Token>{string}</Token>
  }

  function renderTokens() {
    return (
      <>
        {' '}
        {chargeAttackToken}
        {fullAutoToken}
        {autoSummonToken}
        {autoGuardToken}
        {party.turnCount !== undefined && turnCountToken}
        {party.clearTime > 0 && clearTimeToken()}
        {buttonChainToken()}
      </>
    )
  }

  // Render: Notice
  const unlistedNotice = (
    <div className={styles.notice}>
      <div className={styles.icon}>
        <UnlistedIcon />
      </div>
      <p>{t('party.notices.unlisted')}</p>
      <div className={styles.buttons}>
        <Button
          bound={true}
          className="notice no-shrink"
          key="copy_link"
          text={t('party.notices.buttons.copy_link')}
          onClick={copyToClipboard}
        />
        {party.editable && (
          <Button
            bound={true}
            className="notice no-shrink"
            key="change_visibility"
            text={t('party.notices.buttons.change_visibility')}
            onClick={() => handleVisibilityDialogChange(true)}
          />
        )}
      </div>
    </div>
  )

  const privateNotice = (
    <div className={styles.notice}>
      <div className={styles.icon}>
        <PrivateIcon />
      </div>
      <p>{t('party.notices.private')}</p>
      {party.editable && (
        <div className={styles.buttons}>
          <Button
            bound={true}
            className="notice"
            key="change_visibility"
            text={t('party.notices.buttons.change_visibility')}
            onClick={() => handleVisibilityDialogChange(true)}
          />
        </div>
      )}
    </div>
  )

  // Render: Buttons
  const saveButton = () => {
    return (
      <Tooltip content={t('tooltips.save')}>
        <Button
          leftAccessoryIcon={<SaveIcon />}
          className={classNames({
            save: true,
            grow: true,
            saved: partySnapshot.favorited,
          })}
          text={
            appState.party.favorited ? t('buttons.saved') : t('buttons.save')
          }
          onClick={toggleFavorite}
        />
      </Tooltip>
    )
  }

  const remixButton = () => {
    return (
      <Tooltip content={t('tooltips.remix.create')}>
        <Button
          leftAccessoryIcon={<RemixIcon />}
          className="grow"
          text={t('buttons.remix')}
          onClick={openRemixTeamAlert}
        />
      </Tooltip>
    )
  }

  const remixedButton = () => {
    const tooltipString =
      party.remix && party.sourceParty
        ? t('tooltips.remix.source')
        : t('tooltips.remix.deleted')

    const buttonAction =
      party.sourceParty && (() => goTo(party.sourceParty?.shortcode))

    return (
      <Tooltip content={tooltipString}>
        <Button
          blended={true}
          className="remixed"
          leftAccessoryIcon={<RemixIcon />}
          text={t('tokens.remix')}
          size="small"
          disabled={!party.sourceParty}
          onClick={buttonAction}
        />
      </Tooltip>
    )
  }

  return (
    <>
      <header className={styles.wrapper}>
        {party.visibility == 2 && unlistedNotice}
        {party.visibility == 3 && privateNotice}
        <section className={styles.info}>
          <div className={styles.left}>
            <div className={styles.header}>
              <h1 className={party.name ? '' : styles.empty}>
                {party.name ? party.name : t('no_title')}
              </h1>
              {party.remix && remixedButton()}
            </div>
            <div className={styles.attribution}>
              {renderUserBlock()}
              {appState.party.raid && linkedRaidBlock(appState.party.raid)}
              {party.created_at != '' && (
                <time
                  className={styles.lastUpdated}
                  dateTime={new Date(party.created_at).toString()}
                >
                  {formatTimeAgo(new Date(party.created_at), locale)}
                </time>
              )}
            </div>
          </div>
          {props.editable ? (
            <div className={styles.right}>
              <EditPartyModal
                open={detailsOpen}
                party={props.party}
                raidGroups={props.raidGroups}
                onOpenChange={handleDetailsOpenChange}
                updateParty={props.updateCallback}
              >
                <Button
                  className="full"
                  leftAccessoryIcon={<EditIcon />}
                  text={t('buttons.show_info')}
                />
              </EditPartyModal>
              {!props.new && (
                <PartyDropdown
                  editable={props.editable}
                  deleteTeamCallback={props.deleteCallback}
                  remixTeamCallback={props.remixCallback}
                  teamVisibilityCallback={visibilityDialogCallback}
                />
              )}
            </div>
          ) : (
            <div className={styles.right}>
              {saveButton()}
              {remixButton()}
            </div>
          )}
        </section>
        <section className={styles.tokens}>{renderTokens()}</section>
      </header>

      <PartyVisibilityDialog
        open={visibilityDialogOpen}
        value={party.visibility as 1 | 2 | 3}
        onOpenChange={handleVisibilityDialogChange}
        updateParty={props.updateCallback}
      />

      <RemixTeamAlert
        creator={props.editable}
        name={partySnapshot.name ? partySnapshot.name : t('no_title')}
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

      <UrlCopiedToast
        open={copyToastOpen}
        onOpenChange={handleCopyToastOpenChanged}
        onCloseClick={handleCopyToastCloseClicked}
      />
    </>
  )
}

export default PartyHeader
