import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'

import Linkify from 'react-linkify'
import classNames from 'classnames'

import * as AlertDialog from '@radix-ui/react-alert-dialog'

import Button from '~components/Button'
import CharLimitedFieldset from '~components/CharLimitedFieldset'
import RaidDropdown from '~components/RaidDropdown'
import TextFieldset from '~components/TextFieldset'

import { appState } from '~utils/appState'

import CheckIcon from '~public/icons/Check.svg'
import CrossIcon from '~public/icons/Cross.svg'
import EditIcon from '~public/icons/Edit.svg'

import './index.scss'
import Link from 'next/link'
import { formatTimeAgo } from '~utils/timeAgo'

// Props
interface Props {
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

  const [raidSlug, setRaidSlug] = useState('')

  const readOnlyClasses = classNames({
    PartyDetails: true,
    ReadOnly: true,
    Visible: !party.detailsVisible,
  })

  const editableClasses = classNames({
    PartyDetails: true,
    Editable: true,
    Visible: party.detailsVisible,
  })

  const emptyClasses = classNames({
    EmptyDetails: true,
    Visible: !party.detailsVisible,
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

  function toggleDetails() {
    appState.party.detailsVisible = !appState.party.detailsVisible
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

  const userImage = () => {
    if (party.user)
      return (
        <img
          alt={party.user.avatar.picture}
          className={`profile ${party.user.avatar.element}`}
          srcSet={`/profile/${party.user.avatar.picture}.png,
                            /profile/${party.user.avatar.picture}@2x.png 2x`}
          src={`/profile/${party.user.avatar.picture}.png`}
        />
      )
    else return <div className="no-user" />
  }

  const userBlock = () => {
    return (
      <div className={userClass}>
        {userImage()}
        {party.user ? party.user.username : t('no_user')}
      </div>
    )
  }

  const linkedUserBlock = (user: User) => {
    return (
      <div>
        <Link href={`/${user.username}`} passHref>
          <a className={linkClass}>{userBlock()}</a>
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
        value={party.name}
        limit={50}
        onChange={handleInputChange}
        error={errors.name}
        ref={nameInput}
      />
      <RaidDropdown
        showAllRaidsOption={false}
        currentRaid={party.raid ? party.raid.slug : undefined}
        onChange={receiveRaid}
      />
      <TextFieldset
        fieldName="name"
        placeholder={
          'Write your notes here\n\n\nWatch out for the 50% trigger!\nMake sure to click Fediel’s 1 first\nGood luck with RNG!'
        }
        value={party.description}
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
      <div className="info">
        <div className="left">
          <h1 className={!party.name ? 'empty' : ''}>
            {party.name ? party.name : 'Untitled'}
          </h1>
          <div className="attribution">
            {party.user ? linkedUserBlock(party.user) : userBlock()}
            {party.raid ? linkedRaidBlock(party.raid) : ''}
            {party.created_at != undefined ? (
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
        <div className="right">
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
      {party.description ? (
        <p>
          <Linkify>{party.description}</Linkify>
        </p>
      ) : (
        ''
      )}
    </section>
  )

  const emptyDetails = (
    <div className={emptyClasses}>
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
  )

  return (
    <React.Fragment>
      {editable && (party.name || party.description || party.raid)
        ? readOnly
        : emptyDetails}
      {editable}
    </React.Fragment>
  )
}

export default PartyDetails
