import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { setCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { Trans, useTranslation } from 'next-i18next'
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
  username: string
  email: string
  password: string
  passwordConfirmation: string
}

const emailRegex =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const SignupModal = (props: Props) => {
  const router = useRouter()
  const { t } = useTranslation('common')

  // Set up form states and error handling
  const [formValid, setFormValid] = useState(false)
  const [errors, setErrors] = useState<ErrorMap>({
    username: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })

  // States
  const [open, setOpen] = useState(false)

  // Set up form refs
  const usernameInput = React.createRef<HTMLInputElement>()
  const emailInput = React.createRef<HTMLInputElement>()
  const passwordInput = React.createRef<HTMLInputElement>()
  const passwordConfirmationInput = React.createRef<HTMLInputElement>()
  const form = [
    usernameInput,
    emailInput,
    passwordInput,
    passwordConfirmationInput,
  ]

  function register(event: React.FormEvent) {
    event.preventDefault()

    const body = {
      user: {
        username: usernameInput.current?.value,
        email: emailInput.current?.value,
        password: passwordInput.current?.value,
        password_confirmation: passwordConfirmationInput.current?.value,
        language: router.locale,
      },
    }

    if (formValid)
      api.endpoints.users
        .create(body)
        .then((response) => {
          storeCookieInfo(response)
          return response.data.user.user_id
        })
        .then((id) => fetchUserInfo(id))
        .then((infoResponse) => storeUserInfo(infoResponse))
  }

  function storeCookieInfo(response: AxiosResponse) {
    const user = response.data.user

    const cookieObj: AccountCookie = {
      userId: user.user_id,
      username: user.username,
      token: user.token,
    }

    setCookie('account', cookieObj, { path: '/' })
  }

  function fetchUserInfo(id: string) {
    return api.userInfo(id)
  }

  function storeUserInfo(response: AxiosResponse) {
    const user = response.data.user

    const cookieObj: UserCookie = {
      picture: user.picture.picture,
      element: user.picture.element,
      language: user.language,
      gender: user.gender,
    }

    // TODO: Set language
    setCookie('user', cookieObj, { path: '/' })

    accountState.account.user = {
      id: user.id,
      username: user.username,
      picture: user.picture.picture,
      element: user.picture.element,
      gender: user.gender,
    }

    accountState.account.authorized = true
    setOpen(false)
  }

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.preventDefault()

    const fieldName = event.target.name
    const value = event.target.value

    if (value.length >= 3) {
      api.check(fieldName, value).then(
        (response) => {
          processNameCheck(fieldName, value, response.data.available)
        },
        (error) => {
          console.error(error)
        }
      )
    } else {
      validateName(fieldName, value)
    }
  }

  function processNameCheck(
    fieldName: string,
    value: string,
    available: boolean
  ) {
    const newErrors = { ...errors }

    if (available) {
      // Continue checking for errors
      newErrors[fieldName] = ''
      setErrors(newErrors)
      setFormValid(true)

      validateName(fieldName, value)
    } else {
      newErrors[fieldName] = t('modals.signup.errors.field_in_use', {
        field: fieldName,
      })
      setErrors(newErrors)
      setFormValid(false)
    }
  }

  function validateName(fieldName: string, value: string) {
    let newErrors = { ...errors }

    switch (fieldName) {
      case 'username':
        if (value.length < 3)
          newErrors.username = t('modals.signup.errors.username_too_short')
        else if (value.length > 20)
          newErrors.username = t('modals.signup.errors.username_too_long')
        else newErrors.username = ''

        break

      case 'email':
        newErrors.email = emailRegex.test(value)
          ? ''
          : t('modals.signup.errors.invalid_email')
        break

      default:
        break
    }

    setFormValid(validateForm(newErrors))
  }

  function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.preventDefault()

    const { name, value } = event.target
    let newErrors = { ...errors }

    switch (name) {
      case 'password':
        newErrors.password = passwordInput.current?.value.includes(
          usernameInput.current?.value!
        )
          ? t('modals.signup.errors.password_contains_username')
          : ''
        break

      case 'password':
        newErrors.password =
          value.length < 8 ? t('modals.signup.errors.password_too_short') : ''
        break

      case 'confirm_password':
        newErrors.passwordConfirmation =
          passwordInput.current?.value ===
          passwordConfirmationInput.current?.value
            ? ''
            : t('modals.signup.errors.passwords_dont_match')
        break

      default:
        break
    }

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

  function openChange(open: boolean) {
    setOpen(open)
    setErrors({
      username: '',
      email: '',
      password: '',
      passwordConfirmation: '',
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={openChange}>
      <Dialog.Trigger asChild>
        <li className="MenuItem">
          <span>{t('menu.signup')}</span>
        </li>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content
          className="Signup Dialog"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="DialogHeader">
            <Dialog.Title className="DialogTitle">
              {t('modals.signup.title')}
            </Dialog.Title>
            <Dialog.Close className="DialogClose" asChild>
              <span>
                <CrossIcon />
              </span>
            </Dialog.Close>
          </div>

          <form className="form" onSubmit={register}>
            <Fieldset
              fieldName="username"
              placeholder={t('modals.signup.placeholders.username')}
              onChange={handleNameChange}
              error={errors.username}
              ref={usernameInput}
            />

            <Fieldset
              fieldName="email"
              placeholder={t('modals.signup.placeholders.email')}
              onChange={handleNameChange}
              error={errors.email}
              ref={emailInput}
            />

            <Fieldset
              fieldName="password"
              placeholder={t('modals.signup.placeholders.password')}
              onChange={handlePasswordChange}
              error={errors.password}
              ref={passwordInput}
            />

            <Fieldset
              fieldName="confirm_password"
              placeholder={t('modals.signup.placeholders.password_confirm')}
              onChange={handlePasswordChange}
              error={errors.passwordConfirmation}
              ref={passwordConfirmationInput}
            />

            <Button>{t('modals.signup.buttons.confirm')}</Button>

            <Dialog.Description className="terms">
              {/* <Trans i18nKey="modals.signup.agreement">
                                By signing up, I agree to the <Link href="/privacy"><span>Privacy Policy</span></Link><Link href="/usage"><span>Usage Guidelines</span></Link>.
                            </Trans> */}
            </Dialog.Description>
          </form>
        </Dialog.Content>
        <Dialog.Overlay className="Overlay" />
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default SignupModal
