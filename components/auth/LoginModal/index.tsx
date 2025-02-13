import React, { useEffect, useState } from 'react'
import { setCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import axios, { AxiosError, AxiosResponse } from 'axios'

import api from '~utils/api'
import { accountState } from '~utils/accountState'
import changeLanguage from '~utils/changeLanguage'
import { setHeaders } from '~utils/userToken'

import Button from '~components/common/Button'
import Input from '~components/common/Input'
import { Dialog } from '~components/common/Dialog'
import DialogHeader from '~components/common/DialogHeader'
import DialogFooter from '~components/common/DialogFooter'
import DialogContent from '~components/common/DialogContent'

import styles from './index.module.scss'
import { userAgent } from 'next/server'

interface ErrorMap {
  [index: string]: string
  email: string
  password: string
}

const emailRegex =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

interface Props {
  open: boolean
  onOpenChange?: (open: boolean) => void
}

const LoginModal = (props: Props) => {
  const router = useRouter()
  const { t } = useTranslation('common')

  // Set up form states and error handling
  const [formValid, setFormValid] = useState(false)
  const [errors, setErrors] = useState<ErrorMap>({
    email: '',
    password: '',
  })

  // States
  const [open, setOpen] = useState(false)

  // Set up form refs
  const emailInput: React.RefObject<HTMLInputElement> = React.createRef()
  const passwordInput: React.RefObject<HTMLInputElement> = React.createRef()
  const footerRef: React.RefObject<HTMLDivElement> = React.createRef()
  const form: React.RefObject<HTMLInputElement>[] = [emailInput, passwordInput]

  useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    let newErrors = { ...errors }

    switch (name) {
      case 'email':
        if (value.length == 0)
          newErrors.email = t('modals.login.errors.empty_email')
        else if (!emailRegex.test(value))
          newErrors.email = t('modals.login.errors.invalid_email')
        else newErrors.email = ''
        break

      case 'password':
        newErrors.password =
          value.length == 0 ? t('modals.login.errors.empty_password') : ''
        break

      default:
        break
    }

    setErrors(newErrors)
    setFormValid(validateForm(newErrors))
  }

  function validateForm(errors: ErrorMap) {
    let valid = true

    Object.values(form).forEach(
      (input) => input.current?.value.length == 0 && (valid = false)
    )

    Object.values(errors).forEach(
      (error) => error.length > 0 && (valid = false)
    )

    return valid
  }

  function login(event: React.FormEvent) {
    event.preventDefault()

    const body = {
      email: emailInput.current?.value,
      password: passwordInput.current?.value,
      grant_type: 'password',
    }

    if (formValid) {
      api
        .login(body)
        .then((response) => {
          storeCookieInfo(response)
          return response.data.user.username
        })
        .then((username) => fetchUserInfo(username))
        .then((infoResponse) => storeUserInfo(infoResponse))
        .catch((error: Error | AxiosError) => {
          if (axios.isAxiosError(error)) {
            const response = error?.response
            if (response && response.data.error === 'invalid_grant') {
              const errors = {
                email: '',
                password: t('modals.login.errors.invalid_credentials'),
              }
              setErrors(errors)
              setFormValid(validateForm(errors))
            }
          }
        })
    }
  }

  function fetchUserInfo(username: string) {
    return api.userInfo(username)
  }

  function storeCookieInfo(response: AxiosResponse) {
    const resp = response.data

    const cookieObj: AccountCookie = {
      userId: resp.user.id,
      username: resp.user.username,
      role: resp.user.role,
      token: resp.access_token,
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60)
    setCookie('account', cookieObj, { path: '/', expires: expiresAt })

    // Set Axios default headers
    setHeaders()
  }

  function storeUserInfo(response: AxiosResponse) {
    // Extract the user
    const user = response.data

    // Set user data in the user cookie
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60)

    setCookie(
      'user',
      {
        avatar: {
          picture: user.avatar.picture,
          element: user.avatar.element,
        },
        language: user.language,
        gender: user.gender,
        theme: user.theme,
        bahamut: false,
      },
      { path: '/', expires: expiresAt }
    )

    // Set the user data in the account state
    accountState.account.user = {
      id: user.id,
      username: user.username,
      granblueId: '',
      role: user.role,
      avatar: {
        picture: user.avatar.picture,
        element: user.avatar.element,
      },
      gender: user.gender,
      language: user.language,
      theme: user.theme,
      bahamut: false,
    }

    console.log('Authorizing account...')
    accountState.account.authorized = true

    setOpen(false)
    changeLanguage(router, user.language)
  }

  function openChange(open: boolean) {
    setOpen(open)
    setErrors({
      email: '',
      password: '',
    })
    setFormValid(false)

    if (props.onOpenChange) props.onOpenChange(open)
  }

  function onEscapeKeyDown(event: KeyboardEvent) {
    setOpen(false)
  }

  function onOpenAutoFocus(event: Event) {
    event.preventDefault()
    if (emailInput.current) emailInput.current.focus()
  }

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogContent
        className="login"
        footerRef={footerRef}
        onEscapeKeyDown={onEscapeKeyDown}
        onOpenAutoFocus={onOpenAutoFocus}
      >
        <DialogHeader title={t('modals.login.title')} />
        <form onSubmit={login}>
          <div className={styles.fields}>
            <Input
              autoComplete="on"
              bound={true}
              hide1Password={false}
              name="email"
              placeholder={t('modals.login.placeholders.email')}
              type="email"
              error={errors.email}
              ref={emailInput}
              onChange={handleChange}
            />

            <Input
              bound={true}
              hide1Password={false}
              name="password"
              placeholder={t('modals.login.placeholders.password')}
              type="password"
              error={errors.password}
              ref={passwordInput}
              onChange={handleChange}
            />
          </div>
          <DialogFooter
            ref={footerRef}
            rightElements={[
              <Button
                bound={true}
                disabled={!formValid}
                key="confirm"
                text={t('modals.login.buttons.confirm')}
              />,
            ]}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default LoginModal
