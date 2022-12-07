import React, { useState } from 'react'
import { setCookie } from 'cookies-next'
import Router, { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import { AxiosResponse } from 'axios'

import * as Dialog from '@radix-ui/react-dialog'

import api from '~utils/api'
import { accountState } from '~utils/accountState'

import Button from '~components/Button'
import Fieldset from '~components/Input'

import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'

interface Props {}

interface ErrorMap {
  [index: string]: string
  email: string
  password: string
}

const emailRegex =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

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
    }
  }

  function fetchUserInfo(id: string) {
    return api.userInfo(id)
  }

  function storeCookieInfo(response: AxiosResponse) {
    const user = response.data.user

    const cookieObj: AccountCookie = {
      userId: user.id,
      username: user.username,
      token: response.data.access_token,
    }

    setCookie('account', cookieObj, { path: '/' })
  }

  function storeUserInfo(response: AxiosResponse) {
    const user = response.data.user

    const cookieObj: UserCookie = {
      picture: user.picture.picture,
      element: user.picture.element,
      language: user.language,
      gender: user.gender,
    }

    setCookie('user', cookieObj, { path: '/' })

    accountState.account.user = {
      id: user.id,
      username: user.username,
      picture: user.picture.picture,
      element: user.picture.element,
      gender: user.gender,
    }

    console.log('Authorizing account...')
    accountState.account.authorized = true

    setOpen(false)
    changeLanguage(user.language)
  }

  function changeLanguage(newLanguage: string) {
    if (newLanguage !== router.locale) {
      setCookie('NEXT_LOCALE', newLanguage, { path: '/' })
      router.push(router.asPath, undefined, { locale: newLanguage })
    }
  }

  function openChange(open: boolean) {
    setOpen(open)
    setErrors({
      email: '',
      password: '',
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={openChange}>
      <Dialog.Trigger asChild>
        <li className="MenuItem">
          <span>{t('menu.login')}</span>
        </li>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content
          className="Login Dialog"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="DialogHeader">
            <Dialog.Title className="DialogTitle">
              {t('modals.login.title')}
            </Dialog.Title>
            <Dialog.Close className="DialogClose" asChild>
              <span>
                <CrossIcon />
              </span>
            </Dialog.Close>
          </div>

          <form className="form" onSubmit={login}>
            <Fieldset
              fieldName="email"
              placeholder={t('modals.login.placeholders.email')}
              onChange={handleChange}
              error={errors.email}
              ref={emailInput}
            />

            <Fieldset
              fieldName="password"
              placeholder={t('modals.login.placeholders.password')}
              onChange={handleChange}
              error={errors.password}
              ref={passwordInput}
            />

            <Button>{t('modals.login.buttons.confirm')}</Button>
          </form>
        </Dialog.Content>
        <Dialog.Overlay className="Overlay" />
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default LoginModal
