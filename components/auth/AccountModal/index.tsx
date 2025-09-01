'use client'

import React, { useEffect, useState } from 'react'
import { getCookie, setCookie } from 'cookies-next'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

import { Dialog } from '~components/common/Dialog'
import DialogHeader from '~components/common/DialogHeader'
import DialogFooter from '~components/common/DialogFooter'
import DialogContent from '~components/common/DialogContent'
import Button from '~components/common/Button'
import SelectItem from '~components/common/SelectItem'
import SelectTableField from '~components/common/SelectTableField'

import api from '~utils/api'
import changeLanguage from 'utils/changeLanguage'
import { accountState } from '~utils/accountState'
import { pictureData } from '~utils/pictureData'

import styles from './index.module.scss'
import SwitchTableField from '~components/common/SwitchTableField'

interface Props {
  open: boolean
  username?: string
  picture?: string
  gender?: number
  language?: string
  theme?: string
  private?: boolean
  role?: number
  bahamutMode?: boolean
  onOpenChange?: (open: boolean) => void
}

const AccountModal = React.forwardRef<HTMLDivElement, Props>(
  function AccountModal(props: Props, forwardedRef) {
    // Localization
    const { t } = useTranslation('common')
    const router = useRouter()
    // In App Router, locale is handled via cookies
    const currentLocale = getCookie('NEXT_LOCALE') as string || 'en'
    const locale = ['en', 'ja'].includes(currentLocale) ? currentLocale : 'en'

    // useEffect only runs on the client, so now we can safely show the UI
    const [mounted, setMounted] = useState(false)
    const { theme: appTheme, setTheme: setAppTheme } = useTheme()

    // UI State
    const [open, setOpen] = useState(false)

    // Values
    const [username, setUsername] = useState(props.username || '')
    const [picture, setPicture] = useState(props.picture || '')
    const [language, setLanguage] = useState(props.language || '')
    const [gender, setGender] = useState(props.gender || 0)
    const [theme, setTheme] = useState(props.theme || 'system')
    const [bahamutMode, setBahamutMode] = useState(props.bahamutMode || false)

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
              bahamut: bahamutMode,
            }

            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 60)
            setCookie('user', cookieObj, { path: '/', expires: expiresAt })

            accountState.account.user = {
              id: user.id,
              username: user.username,
              granblueId: '',
              role: user.role,
              avatar: {
                picture: user.avatar.picture,
                element: user.avatar.element,
              },
              language: user.language,
              theme: user.theme,
              gender: user.gender,
              bahamut: bahamutMode,
            }

            setOpen(false)
            if (props.onOpenChange) props.onOpenChange(false)
            changeLanguage(router, user.language)
            if (props.bahamutMode != bahamutMode) router.refresh()
          })
      }
    }

    // Views
    const pictureOptions = pictureData
      .sort((a, b) => (a.name.en > b.name.en ? 1 : -1))
      .map((item, i) => {
        return (
          <SelectItem
            key={`picture-${i}`}
            element={item.element}
            icon={{
              alt: item.name[locale],
              src: [
                `/profile/${item.filename}.png`,
                `/profile/${item.filename}@2x.png 2x`,
              ],
            }}
            value={item.filename}
          >
            {item.name[locale]}
          </SelectItem>
        )
      })

    const pictureField = () => (
      <SelectTableField
        name="picture"
        description={t('modals.settings.descriptions.picture')}
        className="image"
        label={t('modals.settings.labels.picture')}
        image={{
          className: pictureData.find((i) => i.filename === picture)?.element,
          src: [`/profile/${picture}.png`, `/profile/${picture}@2x.png 2x`],
          alt: pictureData.find((i) => i.filename === picture)?.name[locale],
        }}
        open={pictureOpen}
        onOpenChange={() => openSelect('picture')}
        onChange={handlePictureChange}
        onClose={() => setPictureOpen(false)}
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

    const adminField = () => (
      <SwitchTableField
        name="admin"
        label={t('modals.settings.labels.admin')}
        value={props.bahamutMode}
        onValueChange={(value: boolean) => setBahamutMode(value)}
      />
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
          headerRef={headerRef}
          footerRef={footerRef}
          onOpenAutoFocus={(event: Event) => {}}
          onEscapeKeyDown={onEscapeKeyDown}
        >
          <DialogHeader
            title={`@${username}`}
            subtitle={t('modals.settings.title')}
          />

          <form onSubmit={update}>
            <div className={styles.fields}>
              {pictureField()}
              {genderField()}
              {languageField()}
              {themeField()}
              {props.role === 9 && adminField()}
            </div>

            <DialogFooter
              ref={footerRef}
              rightElements={[
                <Button
                  bound={true}
                  key="confirm"
                  text={t('modals.settings.buttons.confirm')}
                />,
              ]}
            />
          </form>
        </DialogContent>
      </Dialog>
    )
  }
)

export default AccountModal
