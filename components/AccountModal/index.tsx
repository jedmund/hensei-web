import React, { useState } from 'react'
import { getCookie, setCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '~components/Dialog'
import Button from '~components/Button'
import SelectItem from '~components/SelectItem'
import PictureSelectItem from '~components/PictureSelectItem'
import SelectTableField from '~components/SelectTableField'
// import * as Switch from '@radix-ui/react-switch'

import api from '~utils/api'
import changeLanguage from 'utils/changeLanguage'
import { accountState } from '~utils/accountState'
import { pictureData } from '~utils/pictureData'

import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'

type StateVariables = {
  [key: string]: boolean
  picture: boolean
  gender: boolean
  language: boolean
  theme: boolean
}

interface Props {
  username?: string
  picture?: string
  gender?: number
  language?: string
  theme?: string
  private?: boolean
}

const AccountModal = (props: Props) => {
  // Localization
  const { t } = useTranslation('common')
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  // Cookies
  const accountCookie = getCookie('account')
  const userCookie = getCookie('user')

  const cookieData = {
    account: accountCookie ? JSON.parse(accountCookie as string) : undefined,
    user: userCookie ? JSON.parse(userCookie as string) : undefined,
  }

  // UI State
  const [open, setOpen] = useState(false)
  const [selectOpenState, setSelectOpenState] = useState<StateVariables>({
    picture: false,
    gender: false,
    language: false,
    theme: false,
  })

  // Values
  const [username, setUsername] = useState(props.username || '')
  const [picture, setPicture] = useState(props.picture || '')
  const [language, setLanguage] = useState(props.language || '')
  const [gender, setGender] = useState(props.gender || 0)
  const [theme, setTheme] = useState(props.theme || 'system')
  // const [privateProfile, setPrivateProfile] = useState(false)

  // Setup

  // UI management
  function openChange(open: boolean) {
    setOpen(open)
  }

  function openSelect(name: 'picture' | 'gender' | 'language' | 'theme') {
    const stateVars = selectOpenState
    Object.keys(stateVars).forEach((key) => {
      if (key === name) {
        stateVars[name] = true
      } else {
        stateVars[key] = false
      }
    })

    setSelectOpenState(stateVars)
  }

  // Event handlers
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

  // API calls
  function update(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const object = {
      user: {
        picture: picture,
        element: pictureData.find((i) => i.filename === picture)?.element,
        language: language,
        gender: gender,
        theme: theme,
        // private: privateProfile,
      },
    }

    if (accountState.account.user) {
      api.endpoints.users
        .update(accountState.account.user?.id, object)
        .then((response) => {
          const user = response.data
          console.log(user)

          const cookieObj = {
            picture: user.avatar.picture,
            element: user.avatar.element,
            gender: user.gender,
            language: user.language,
            theme: user.theme,
          }

          setCookie('user', cookieObj, { path: '/' })

          accountState.account.user = {
            id: user.id,
            username: user.username,
            picture: user.avatar.picture,
            element: user.avatar.element,
            language: user.language,
            theme: user.theme,
            gender: user.gender,
          }

          setOpen(false)
          changeLanguage(router, user.language)
          router.push(router.asPath, undefined)
        })
    }
  }

  // Views
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

  const pictureField = () => (
    <SelectTableField
      name="picture"
      description={t('modals.settings.descriptions.picture')}
      className="Image"
      label={t('modals.settings.labels.picture')}
      open={selectOpenState.picture}
      onClick={() => openSelect('picture')}
      onChange={handlePictureChange}
      imageAlt={t('modals.settings.labels.image_alt')}
      imageClass={pictureData.find((i) => i.filename === picture)?.element}
      imageSrc={[`/profile/${picture}.png`, `/profile/${picture}@2x.png 2x`]}
      value={picture}
    >
      {pictureOptions}
    </SelectTableField>
  )

  const genderField = () => (
    <SelectTableField
      name="gender"
      description={t('modals.settings.descriptions.gender')}
      label={t('modals.settings.labels.gender')}
      open={selectOpenState.gender}
      onClick={() => openSelect('gender')}
      onChange={handleGenderChange}
      value={`${gender}`}
    >
      <SelectItem key="gran" value="0">
        {t('modals.settings.gender.gran')}
      </SelectItem>
      <SelectItem key="djeeta" value="1">
        {t('modals.settings.gender.djeeta')}
      </SelectItem>
    </SelectTableField>
  )

  const languageField = () => (
    <SelectTableField
      name="language"
      label={t('modals.settings.labels.language')}
      open={selectOpenState.language}
      onClick={() => openSelect('language')}
      onChange={handleLanguageChange}
      value={language}
    >
      <SelectItem key="en" value="en">
        {t('modals.settings.language.english')}
      </SelectItem>
      <SelectItem key="ja" value="ja">
        {t('modals.settings.language.japanese')}
      </SelectItem>
    </SelectTableField>
  )

  const themeField = () => (
    <SelectTableField
      name="theme"
      label={t('modals.settings.labels.theme')}
      open={selectOpenState.theme}
      onClick={() => openSelect('theme')}
      onChange={handleThemeChange}
      value={theme}
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
    </SelectTableField>
  )

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
          {pictureField()}
          {genderField()}
          {languageField()}
          {themeField()}
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
