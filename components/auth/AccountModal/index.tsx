import React, { useEffect, useState } from 'react'
import { getCookie, setCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

import {
  Dialog,
  DialogClose,
  DialogTitle,
  DialogTrigger,
} from '~components/common/Dialog'
import DialogContent from '~components/common/DialogContent'
import Button from '~components/common/Button'
import SelectItem from '~components/common/SelectItem'
import PictureSelectItem from '~components/common/PictureSelectItem'
import SelectTableField from '~components/common/SelectTableField'
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
  open: boolean
  username?: string
  picture?: string
  gender?: number
  language?: string
  theme?: string
  private?: boolean
  onOpenChange?: (open: boolean) => void
}

const AccountModal = React.forwardRef<HTMLDivElement, Props>(
  function AccountModal(props: Props, forwardedRef) {
    // Localization
    const { t } = useTranslation('common')
    const router = useRouter()
    const locale =
      router.locale && ['en', 'ja'].includes(router.locale)
        ? router.locale
        : 'en'

    // useEffect only runs on the client, so now we can safely show the UI
    const [mounted, setMounted] = useState(false)
    const { theme: appTheme, setTheme: setAppTheme } = useTheme()

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
    const [pictureOpen, setPictureOpen] = useState(false)
    const [genderOpen, setGenderOpen] = useState(false)
    const [languageOpen, setLanguageOpen] = useState(false)
    const [themeOpen, setThemeOpen] = useState(false)

    // Refs
    const headerRef = React.createRef<HTMLDivElement>()
    const footerRef = React.createRef<HTMLDivElement>()

    useEffect(() => {
      setOpen(props.open)
    }, [props.open])

    // UI management
    function openChange(open: boolean) {
      if (props.onOpenChange) props.onOpenChange(open)
      setOpen(open)
    }

    function openSelect(name: 'picture' | 'gender' | 'language' | 'theme') {
      setPictureOpen(name === 'picture' ? !pictureOpen : false)
      setGenderOpen(name === 'gender' ? !genderOpen : false)
      setLanguageOpen(name === 'language' ? !languageOpen : false)
      setThemeOpen(name === 'theme' ? !themeOpen : false)
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
      setAppTheme(value)
    }

    function onEscapeKeyDown(event: KeyboardEvent) {
      if (pictureOpen || genderOpen || languageOpen || themeOpen) {
        return event.preventDefault()
      } else {
        setOpen(false)
      }
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

            const cookieObj = {
              avatar: {
                picture: user.avatar.picture,
                element: user.avatar.element,
              },
              gender: user.gender,
              language: user.language,
              theme: user.theme,
            }

            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 60)
            setCookie('user', cookieObj, { path: '/', expires: expiresAt })

            accountState.account.user = {
              id: user.id,
              username: user.username,
              granblueId: '',
              avatar: {
                picture: user.avatar.picture,
                element: user.avatar.element,
              },
              language: user.language,
              theme: user.theme,
              gender: user.gender,
            }

            setOpen(false)
            if (props.onOpenChange) props.onOpenChange(false)
            changeLanguage(router, user.language)
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
        open={pictureOpen}
        onOpenChange={() => openSelect('picture')}
        onChange={handlePictureChange}
        onClose={() => setPictureOpen(false)}
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
        open={genderOpen}
        onOpenChange={() => openSelect('gender')}
        onChange={handleGenderChange}
        onClose={() => setGenderOpen(false)}
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
        open={languageOpen}
        onOpenChange={() => openSelect('language')}
        onChange={handleLanguageChange}
        onClose={() => setLanguageOpen(false)}
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
        open={themeOpen}
        onOpenChange={() => openSelect('theme')}
        onChange={handleThemeChange}
        onClose={() => setThemeOpen(false)}
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

    useEffect(() => {
      setMounted(true)
    }, [])

    if (!mounted) {
      return null
    }

    return (
      <Dialog open={open} onOpenChange={openChange}>
        <DialogContent
          className="Account"
          headerref={headerRef}
          footerref={footerRef}
          onOpenAutoFocus={(event: Event) => {}}
          onEscapeKeyDown={onEscapeKeyDown}
        >
          <div className="DialogHeader" ref={headerRef}>
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
            <div className="Fields">
              {pictureField()}
              {genderField()}
              {languageField()}
              {themeField()}
            </div>
            <div className="DialogFooter" ref={footerRef}>
              <Button
                contained={true}
                text={t('modals.settings.buttons.confirm')}
              />
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  }
)

export default AccountModal
