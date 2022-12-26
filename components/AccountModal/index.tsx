import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '~components/Dialog'
// import * as Dialog from '@radix-ui/react-dialog'
import * as Switch from '@radix-ui/react-switch'

import Select from '~components/Select'
import SelectItem from '~components/SelectItem'
import PictureSelectItem from '~components/PictureSelectItem'

import api from '~utils/api'
import { accountState } from '~utils/accountState'
import { pictureData } from '~utils/pictureData'

import Button from '~components/Button'

import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'
import { useSnapshot } from 'valtio'
import { getCookie, setCookie } from 'cookies-next'

const AccountModal = () => {
  const router = useRouter()
  const { t } = useTranslation('common')
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  const accountCookie = getCookie('account')
  const userCookie = getCookie('user')

  const cookieData = {
    account: accountCookie ? JSON.parse(accountCookie as string) : undefined,
    user: userCookie ? JSON.parse(userCookie as string) : undefined,
  }

  // State
  const [open, setOpen] = useState(false)
  const [openPictureSelect, setOpenPictureSelect] = useState(false)
  const [openGenderSelect, setOpenGenderSelect] = useState(false)
  const [openLanguageSelect, setOpenLanguageSelect] = useState(false)
  const [openThemeSelect, setOpenThemeSelect] = useState(false)

  const [username, setUsername] = useState('')
  const [picture, setPicture] = useState('')
  const [language, setLanguage] = useState('')
  const [gender, setGender] = useState(0)
  const [theme, setTheme] = useState('system')
  // const [privateProfile, setPrivateProfile] = useState(false)

  useEffect(() => {
    setUsername(cookieData.account.username)
    setGender(cookieData.user.gender)
    setPicture(cookieData.user.picture)
    setLanguage(cookieData.user.language)
    setTheme(cookieData.user.theme ? cookieData.user.theme : 'system')
  }, [cookieData])

  const pictureOptions = pictureData
    .sort((a, b) => (a.name.en > b.name.en ? 1 : -1))
    .map((item, i) => {
      return (
        <PictureSelectItem
          key={`picture-${i}`}
          element={item.element}
          src={[
            `/profile/${item.filename}.png`,
            `/profile/${item.filename}@2x.png 2x`,
          ]}
          value={item.filename}
        >
          {item.name[locale]}
        </PictureSelectItem>
      )
    })

  function handlePictureChange(value: string) {
    setPicture(value)
  }

  function handleLanguageChange(value: string) {
    setLanguage(value)
  }

  function handleGenderChange(value: string) {
    setGender(parseInt(value))
  }

  function handleThemeChange(value: string) {
    setTheme(value)
  }

  // function handlePrivateChange(checked: boolean) {
  //   setPrivateProfile(checked)
  // }

  function update(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const object = {
      user: {
        picture: picture,
        element: pictureData.find((i) => i.filename === picture)?.element,
        language: language,
        gender: gender,
        // private: privateProfile,
      },
    }

    api.endpoints.users
      .update(cookieData.account.user_id, object)
      .then((response) => {
        const user = response.data.user

        const cookieObj = {
          picture: user.picture.picture,
          element: user.picture.element,
          gender: user.gender,
          language: user.language,
        }

        setCookie('user', cookieObj, { path: '/' })

        accountState.account.user = {
          id: user.id,
          username: user.username,
          picture: user.picture.picture,
          element: user.picture.element,
          language: user.language,
          theme: user.theme,
          gender: user.gender,
        }

        setOpen(false)
        changeLanguage(user.language)
      })
  }

  function changeLanguage(newLanguage: string) {
    if (newLanguage !== router.locale) {
      // setCookies("NEXT_LOCALE", newLanguage, { path: "/" })
      // router.push(router.asPath, undefined, { locale: newLanguage })
    }
  }

  function openChange(open: boolean) {
    setOpen(open)
  }

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>
        <li className="MenuItem">
          <span>{t('menu.settings')}</span>
        </li>
      </DialogTrigger>
      <DialogContent className="Account Dialog">
        <div className="DialogHeader">
          <div className="DialogTop">
            <DialogTitle className="SubTitle">
              {t('modals.settings.title')}
            </DialogTitle>
            <DialogTitle className="DialogTitle">@{username}</DialogTitle>
          </div>
          <DialogClose className="DialogClose" asChild>
            <span>
              <CrossIcon />
            </span>
          </DialogClose>
        </div>

        <form onSubmit={update}>
          <div className="field">
            <div className="left">
              <label>{t('modals.settings.labels.picture')}</label>
              {/* <p className={locale}>Displayed next to your name</p> */}
            </div>

            <div
              className={`preview ${
                pictureData.find((i) => i.filename === picture)?.element
              }`}
            >
              {picture ? (
                <img
                  alt="Profile preview"
                  srcSet={`/profile/${picture}.png,
                                             /profile/${picture}@2x.png 2x`}
                  src={`/profile/${picture}.png`}
                />
              ) : (
                ''
              )}
            </div>

            <Select
              name="picture"
              open={openPictureSelect}
              onClick={() => setOpenPictureSelect(!openPictureSelect)}
              onValueChange={handlePictureChange}
              triggerClass="Bound Table"
              value={picture}
            >
              {pictureOptions}
            </Select>
          </div>
          <div className="field">
            <div className="left">
              <label>{t('modals.settings.labels.gender')}</label>
              {/* <p className={locale}>
                  Displayed on the Character tab of your teams
                </p> */}
            </div>

            <Select
              name="gender"
              open={openGenderSelect}
              onClick={() => setOpenGenderSelect(!openGenderSelect)}
              onValueChange={handleGenderChange}
              triggerClass="Bound Table"
              value={`${gender}`}
            >
              <SelectItem key="gran" value="0">
                {t('modals.settings.gender.gran')}
              </SelectItem>
              <SelectItem key="djeeta" value="1">
                {t('modals.settings.gender.djeeta')}
              </SelectItem>
            </Select>
          </div>
          <div className="field">
            <div className="left">
              <label>{t('modals.settings.labels.language')}</label>
            </div>

            <Select
              name="language"
              open={openLanguageSelect}
              onClick={() => setOpenLanguageSelect(!openLanguageSelect)}
              onValueChange={handleLanguageChange}
              triggerClass="Bound Table"
              value={`${language}`}
            >
              <SelectItem key="en" value="en">
                {t('modals.settings.language.english')}
              </SelectItem>
              <SelectItem key="ja" value="ja">
                {t('modals.settings.language.japanese')}
              </SelectItem>
            </Select>
          </div>
          <div className="field">
            <div className="left">
              <label>{t('modals.settings.labels.theme')}</label>
            </div>

            <Select
              name="theme"
              open={openThemeSelect}
              onClick={() => setOpenThemeSelect(!openThemeSelect)}
              onValueChange={handleThemeChange}
              triggerClass="Bound Table"
              value={`${theme}`}
            >
              <SelectItem key="system" value="system">
                {t('modals.settings.theme.system')}
              </SelectItem>
              <SelectItem key="light" value="light">
                {t('modals.settings.theme.light')}
              </SelectItem>
              <SelectItem key="dark" value="dark">
                {t('modals.settings.theme.dark')}
              </SelectItem>
            </Select>
          </div>
          {/* <div className="field">
              <div className="left">
                <label>{t('modals.settings.labels.private')}</label>
                <p className={locale}>
                  {t('modals.settings.descriptions.private')}
                </p>
              </div>

              <Switch.Root
                className="Switch"
                onCheckedChange={handlePrivateChange}
                checked={privateProfile}
              >
                <Switch.Thumb className="Thumb" />
              </Switch.Root>
            </div> */}

          <Button
            contained={true}
            text={t('modals.settings.buttons.confirm')}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AccountModal
