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

import { accountState } from '~utils/accountState'
import { appState } from '~utils/appState'

import CheckIcon from '~public/icons/Check.svg'
import CrossIcon from '~public/icons/Cross.svg'
import EditIcon from '~public/icons/Edit.svg'

import './index.scss'
import Link from 'next/link'
import { formatTimeAgo } from '~utils/timeAgo'

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

  const readOnlyClasses = classNames({
    PartyDetails: true,
    ReadOnly: true,
    Visible: true,
  })

  const editableClasses = classNames({
    PartyDetails: true,
    Editable: true,
    Visible: open,
  })

  const emptyClasses = classNames({
    EmptyDetails: true,
    Visible: true,
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
      <div className="info">
        <div className="left">
          <h1 className={!party.name ? 'empty' : ''}>
            {party.name ? party.name : 'Untitled'}
          </h1>
          <div className="attribution">
            {accountState.account.authorized && props.new
              ? linkedUserBlock(
                  accountState.account.user?.username,
                  accountState.account.user?.picture,
                  accountState.account.user?.element
                )
              : userBlock()}
            {party.user && !props.new
              ? linkedUserBlock(
                  party.user.username,
                  party.user.avatar.picture,
                  party.user.avatar.element
                )
              : ''}
            {!party.user && !props.new ? userBlock() : ''}
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

  return (
    <React.Fragment>
      {readOnly}
      {editable}
    </React.Fragment>
  )
}

export default PartyDetails
