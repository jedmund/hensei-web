import React, { useState } from 'react'
import { setCookie } from 'cookies-next'
import Router, { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import axios, { AxiosError, AxiosResponse } from 'axios'

import api from '~utils/api'
import { accountState } from '~utils/accountState'

import Button from '~components/Button'
import Input from '~components/Input'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
} from '~components/Dialog'

import changeLanguage from '~utils/changeLanguage'

import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'

interface ErrorMap {
  [index: string]: string
  email: string
  password: string
}

const emailRegex =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const LoginModal = () => {
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
  const form: React.RefObject<HTMLInputElement>[] = [emailInput, passwordInput]

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

    console.log(errors)

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
          return response.data.user.id
        })
        .then((id) => fetchUserInfo(id))
        .then((infoResponse) => storeUserInfo(infoResponse))
        .catch((error: Error | AxiosError) => {
          console.log(error)

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

  function fetchUserInfo(id: string) {
    return api.userInfo(id)
  }

  function storeCookieInfo(response: AxiosResponse) {
    const resp = response.data

    const cookieObj: AccountCookie = {
      userId: resp.user.id,
      username: resp.user.username,
      token: resp.access_token,
    }

    setCookie('account', cookieObj, { path: '/' })
  }

  function storeUserInfo(response: AxiosResponse) {
    // Extract the user
    const user = response.data

    // Set user data in the user cookie
    setCookie(
      'user',
      {
        picture: user.avatar.picture,
        element: user.avatar.element,
        language: user.language,
        gender: user.gender,
        theme: user.theme,
      },
      { path: '/' }
    )

    // Set the user data in the account state
    accountState.account.user = {
      id: user.id,
      username: user.username,
      picture: user.avatar.picture,
      element: user.avatar.element,
      gender: user.gender,
      language: user.language,
      theme: user.theme,
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
      <DialogTrigger asChild>
        <li className="MenuItem">
          <span>{t('menu.login')}</span>
        </li>
      </DialogTrigger>
      <DialogContent
        className="Login Dialog"
        onEscapeKeyDown={onEscapeKeyDown}
        onOpenAutoFocus={onOpenAutoFocus}
      >
        <div className="DialogHeader">
          <div className="DialogTitle">
            <h1>{t('modals.login.title')}</h1>
          </div>
          <DialogClose className="DialogClose">
            <CrossIcon />
          </DialogClose>
        </div>

        <form className="form" onSubmit={login}>
          <Input
            className="Bound"
            name="email"
            placeholder={t('modals.login.placeholders.email')}
            onChange={handleChange}
            error={errors.email}
            ref={emailInput}
          />

          <Input
            className="Bound"
            name="password"
            placeholder={t('modals.login.placeholders.password')}
            type="password"
            onChange={handleChange}
            error={errors.password}
            ref={passwordInput}
          />

          <Button
            disabled={!formValid}
            text={t('modals.login.buttons.confirm')}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default LoginModal
