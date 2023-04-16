import React, { useEffect, useState, ChangeEvent, KeyboardEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import Button from '~components/common/Button'
import CharLimitedFieldset from '~components/common/CharLimitedFieldset'
import DurationInput from '~components/common/DurationInput'
import Input from '~components/common/Input'
import RaidDropdown from '~components/RaidDropdown'
import Switch from '~components/common/Switch'
import Tooltip from '~components/common/Tooltip'
import Token from '~components/common/Token'

import PartyDropdown from '~components/party/PartyDropdown'

import { accountState } from '~utils/accountState'
import { appState, initialAppState } from '~utils/appState'
import { formatTimeAgo } from '~utils/timeAgo'

import CheckIcon from '~public/icons/Check.svg'
import EditIcon from '~public/icons/Edit.svg'
import RemixIcon from '~public/icons/Remix.svg'

import type { DetailsObject } from 'types'

import './index.scss'

// Props
interface Props {
  party?: Party
  new: boolean
  editable: boolean
  deleteCallback: () => void
  remixCallback: () => void
  updateCallback: (details: DetailsObject) => void
}

const PartyHeader = (props: Props) => {
  const { party, raids } = useSnapshot(appState)

  const { t } = useTranslation('common')
  const router = useRouter()
  const locale = router.locale || 'en'

  const nameInput = React.createRef<HTMLInputElement>()
  const descriptionInput = React.createRef<HTMLTextAreaElement>()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [alertOpen, setAlertOpen] = useState(false)

  const [chargeAttack, setChargeAttack] = useState(true)
  const [fullAuto, setFullAuto] = useState(false)
  const [autoGuard, setAutoGuard] = useState(false)

  const [buttonCount, setButtonCount] = useState<number | undefined>(undefined)
  const [chainCount, setChainCount] = useState<number | undefined>(undefined)
  const [turnCount, setTurnCount] = useState<number | undefined>(undefined)
  const [clearTime, setClearTime] = useState(0)

  const [raidSlug, setRaidSlug] = useState('')

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

  useEffect(() => {
    if (props.party) {
      setName(props.party.name)
      setAutoGuard(props.party.auto_guard)
      setFullAuto(props.party.full_auto)
      setChargeAttack(props.party.charge_attack)
      setClearTime(props.party.clear_time)
      if (props.party.turn_count) setTurnCount(props.party.turn_count)
      if (props.party.button_count) setButtonCount(props.party.button_count)
      if (props.party.chain_count) setChainCount(props.party.chain_count)
    }
  }, [props.party])

  // Subscribe to router changes and reset state
  // if the new route is a new team
  useEffect(() => {
    router.events.on('routeChangeStart', (url, { shallow }) => {
      if (url === '/new' || url === '/') {
        const party = initialAppState.party

        setName(party.name ? party.name : '')
        setAutoGuard(party.autoGuard)
        setFullAuto(party.fullAuto)
        setChargeAttack(party.chargeAttack)
        setClearTime(party.clearTime)
        setTurnCount(party.turnCount)
        setButtonCount(party.buttonCount)
        setChainCount(party.chainCount)
      }
    })
  }, [])

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.preventDefault()

    const { name, value } = event.target
    setName(value)

    let newErrors = errors
    setErrors(newErrors)
  }

  function handleChargeAttackChanged(checked: boolean) {
    setChargeAttack(checked)
  }

  function handleFullAutoChanged(checked: boolean) {
    setFullAuto(checked)
  }

  function handleAutoGuardChanged(checked: boolean) {
    setAutoGuard(checked)
  }

  function handleClearTimeInput(value: number) {
    if (!isNaN(value)) setClearTime(value)
  }

  function handleTurnCountInput(event: React.ChangeEvent<HTMLInputElement>) {
    const value = parseInt(event.currentTarget.value)
    if (!isNaN(value)) setTurnCount(value)
  }

  function handleButtonCountInput(event: ChangeEvent<HTMLInputElement>) {
    const value = parseInt(event.currentTarget.value)
    if (!isNaN(value)) setButtonCount(value)
  }

  function handleChainCountInput(event: ChangeEvent<HTMLInputElement>) {
    const value = parseInt(event.currentTarget.value)
    if (!isNaN(value)) setChainCount(value)
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      // Allow the key to be processed normally
      return
    }

    // Get the current value
    const input = event.currentTarget
    let value = event.currentTarget.value

    // Check if the key that was pressed is the backspace key
    if (event.key === 'Backspace') {
      // Remove the colon if the value is "12:"
      if (value.length === 4) {
        value = value.slice(0, -1)
      }

      // Allow the backspace key to be processed normally
      input.value = value
      return
    }

    // Check if the key that was pressed is the tab key
    if (event.key === 'Tab') {
      // Allow the tab key to be processed normally
      return
    }

    // Get the character that was entered and check if it is numeric
    const char = parseInt(event.key)
    const isNumber = !isNaN(char)

    // Check if the character should be accepted or rejected
    const numberValue = parseInt(`${value}${char}`)
    const minValue = parseInt(event.currentTarget.min)
    const maxValue = parseInt(event.currentTarget.max)

    if (!isNumber || numberValue < minValue || numberValue > maxValue) {
      // Reject the character if it isn't a number,
      // or if it exceeds the min and max values
      event.preventDefault()
    }
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

  function receiveRaid(slug?: string) {
    if (slug) setRaidSlug(slug)
  }

  function switchValue(value: boolean) {
    if (value) return 'on'
    else return 'off'
  }

  function updateDetails(event: React.MouseEvent) {
    const descriptionValue = descriptionInput.current?.value
    const raid = raids.find((raid) => raid.slug === raidSlug)

    const details: DetailsObject = {
      fullAuto: fullAuto,
      autoGuard: autoGuard,
      chargeAttack: chargeAttack,
      clearTime: clearTime,
      buttonCount: buttonCount,
      turnCount: turnCount,
      chainCount: chainCount,
      name: name,
      description: descriptionValue,
      raid: raid,
    }

    props.updateCallback(details)
    toggleDetails()
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

  const editable = () => {
    return (
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
        <ul className="SwitchToggleGroup DetailToggleGroup">
          <li className="Ougi ToggleSection">
            <label htmlFor="ougi">
              <span>{t('party.details.labels.charge_attack')}</span>
              <div>
                <Switch
                  name="charge_attack"
                  onCheckedChange={handleChargeAttackChanged}
                  value={switchValue(chargeAttack)}
                  checked={chargeAttack}
                />
              </div>
            </label>
          </li>
          <li className="FullAuto ToggleSection">
            <label htmlFor="full_auto">
              <span>{t('party.details.labels.full_auto')}</span>
              <div>
                <Switch
                  onCheckedChange={handleFullAutoChanged}
                  name="full_auto"
                  value={switchValue(fullAuto)}
                  checked={fullAuto}
                />
              </div>
            </label>
          </li>
          <li className="AutoGuard ToggleSection">
            <label htmlFor="auto_guard">
              <span>{t('party.details.labels.auto_guard')}</span>
              <div>
                <Switch
                  onCheckedChange={handleAutoGuardChanged}
                  name="auto_guard"
                  value={switchValue(autoGuard)}
                  disabled={!fullAuto}
                  checked={autoGuard}
                />
              </div>
            </label>
          </li>
        </ul>
        <ul className="InputToggleGroup DetailToggleGroup">
          <li className="InputSection">
            <label htmlFor="auto_guard">
              <span>{t('party.details.labels.button_chain')}</span>
              <div className="Input Bound">
                <Input
                  name="buttons"
                  type="number"
                  placeholder="0"
                  value={`${buttonCount}`}
                  min="0"
                  max="99"
                  onChange={handleButtonCountInput}
                  onKeyDown={handleInputKeyDown}
                />
                <span>b</span>
                <Input
                  name="chains"
                  type="number"
                  placeholder="0"
                  min="0"
                  max="99"
                  value={`${chainCount}`}
                  onChange={handleChainCountInput}
                  onKeyDown={handleInputKeyDown}
                />
                <span>c</span>
              </div>
            </label>
          </li>
          <li className="InputSection">
            <label htmlFor="auto_guard">
              <span>{t('party.details.labels.turn_count')}</span>
              <Input
                name="turn_count"
                className="AlignRight Bound"
                type="number"
                step="1"
                min="1"
                max="999"
                placeholder="0"
                value={`${turnCount}`}
                onChange={handleTurnCountInput}
                onKeyDown={handleInputKeyDown}
              />
            </label>
          </li>
          <li className="InputSection">
            <label htmlFor="auto_guard">
              <span>{t('party.details.labels.clear_time')}</span>
              <div>
                <DurationInput
                  name="clear_time"
                  className="Bound"
                  placeholder="00:00"
                  value={clearTime}
                  onValueChange={(value: number) => handleClearTimeInput(value)}
                />
              </div>
            </label>
          </li>
        </ul>

        <div className="bottom">
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

  const clearTimeString = () => {
    const minutes = Math.floor(clearTime / 60)
    const seconds = clearTime - minutes * 60

    if (minutes > 0)
      return `${minutes}${t('party.details.suffix.minutes')} ${seconds}${t(
        'party.details.suffix.seconds'
      )}`
    else return `${seconds}${t('party.details.suffix.seconds')}`
  }

  const buttonChainToken = () => {
    if (buttonCount || chainCount) {
      let string = ''

      if (buttonCount && buttonCount > 0) {
        string += `${buttonCount}b`
      }

      if (!buttonCount && chainCount && chainCount > 0) {
        string += `0${t('party.details.suffix.buttons')}${chainCount}${t(
          'party.details.suffix.chains'
        )}`
      } else if (buttonCount && chainCount && chainCount > 0) {
        string += `${chainCount}${t('party.details.suffix.chains')}`
      } else if (buttonCount && !chainCount) {
        string += `0${t('party.details.suffix.chains')}`
      }

      return <Token>{string}</Token>
    }
  }

  const readOnly = () => {
    return (
      <section className={readOnlyClasses}>
        <section className="Details">
          <Token
            className={classNames({
              ChargeAttack: true,
              On: chargeAttack,
              Off: !chargeAttack,
            })}
          >
            {`${t('party.details.labels.charge_attack')} ${
              chargeAttack ? 'On' : 'Off'
            }`}
          </Token>

          <Token
            className={classNames({
              FullAuto: true,
              On: fullAuto,
              Off: !fullAuto,
            })}
          >
            {`${t('party.details.labels.full_auto')} ${
              fullAuto ? 'On' : 'Off'
            }`}
          </Token>

          <Token
            className={classNames({
              AutoGuard: true,
              On: autoGuard,
              Off: !autoGuard,
            })}
          >
            {`${t('party.details.labels.auto_guard')} ${
              autoGuard ? 'On' : 'Off'
            }`}
          </Token>

          {turnCount ? (
            <Token>
              {t('party.details.turns.with_count', {
                count: turnCount,
              })}
            </Token>
          ) : (
            ''
          )}
          {clearTime > 0 ? <Token>{clearTimeString()}</Token> : ''}
          {buttonChainToken()}
        </section>
      </section>
    )
  }

  return (
    <>
      <section className="DetailsWrapper">
        <div className="PartyInfo">
          <div className="Left">
            <div className="Header">
              <h1 className={name ? '' : 'empty'}>
                {name ? name : t('no_title')}
              </h1>
              {party.remix && party.sourceParty ? (
                <Tooltip content={t('tooltips.source')}>
                  <Button
                    className="IconButton Blended"
                    leftAccessoryIcon={<RemixIcon />}
                    text={t('tokens.remix')}
                    onClick={() => goTo(party.sourceParty?.shortcode)}
                  />
                </Tooltip>
              ) : (
                ''
              )}
            </div>
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
          {party.editable ? (
            <div className="Right">
              <Button
                leftAccessoryIcon={<EditIcon />}
                text={t('buttons.show_info')}
                onClick={toggleDetails}
              />
              <PartyDropdown
                editable={props.editable}
                deleteTeamCallback={props.deleteCallback}
                remixTeamCallback={props.remixCallback}
              />
            </div>
          ) : (
            ''
          )}
        </div>
        {readOnly()}
        {editable()}
      </section>
    </>
  )
}

export default PartyHeader
