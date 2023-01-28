import React, { useEffect, useState } from 'react'
import { setCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { AxiosResponse } from 'axios'

import api from '~utils/api'
import setUserToken from '~utils/setUserToken'
import { accountState } from '~utils/accountState'

import Button from '~components/Button'
import Input from '~components/Input'
import { Dialog, DialogTrigger, DialogClose } from '~components/Dialog'
import DialogContent from '~components/DialogContent'
import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'

interface Props {
  open: boolean
  onOpenChange?: (open: boolean) => void
}

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
  const footerRef = React.createRef<HTMLDivElement>()

  const form = [
    usernameInput,
    emailInput,
    passwordInput,
    passwordConfirmationInput,
  ]

  useEffect(() => {
    setOpen(props.open)
  }, [props.open])

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
          return response.data.id
        })
        .then((id) => fetchUserInfo(id))
        .then((infoResponse) => storeUserInfo(infoResponse))
  }

  function storeCookieInfo(response: AxiosResponse) {
    const resp = response.data

    const cookieObj: AccountCookie = {
      userId: resp.id,
      username: resp.username,
      token: resp.token,
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60)
    setCookie('account', cookieObj, { path: '/', expires: expiresAt })

    // Set Axios default headers
    setUserToken()
  }

  function fetchUserInfo(id: string) {
    return api.userInfo(id)
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
        picture: user.avatar.picture,
        element: user.avatar.element,
        language: user.language,
        gender: user.gender,
        theme: user.theme,
      },
      { path: '/', expires: expiresAt }
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

    if (props.onOpenChange) props.onOpenChange(open)
  }

  function onEscapeKeyDown(event: KeyboardEvent) {
    setOpen(false)
  }

  function onOpenAutoFocus(event: Event) {
    event.preventDefault()
    if (usernameInput.current) usernameInput.current.focus()
  }

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogContent
        className="Signup"
        footerref={footerRef}
        onEscapeKeyDown={onEscapeKeyDown}
        onOpenAutoFocus={onOpenAutoFocus}
      >
        <div className="DialogHeader">
          <div className="DialogTitle">
            <h1>{t('modals.signup.title')}</h1>
          </div>
          <DialogClose className="DialogClose">
            <CrossIcon />
          </DialogClose>
        </div>

        <form className="form" onSubmit={register}>
          <div className="Fields">
            <Input
              className="Bound"
              name="username"
              placeholder={t('modals.signup.placeholders.username')}
              onChange={handleNameChange}
              error={errors.username}
              ref={usernameInput}
            />

            <Input
              className="Bound"
              name="email"
              placeholder={t('modals.signup.placeholders.email')}
              onChange={handleNameChange}
              error={errors.email}
              ref={emailInput}
            />

            <Input
              className="Bound"
              name="password"
              placeholder={t('modals.signup.placeholders.password')}
              type="password"
              onChange={handlePasswordChange}
              error={errors.password}
              ref={passwordInput}
            />

            <Input
              className="Bound"
              name="confirm_password"
              placeholder={t('modals.signup.placeholders.password_confirm')}
              type="password"
              onChange={handlePasswordChange}
              error={errors.passwordConfirmation}
              ref={passwordConfirmationInput}
            />
          </div>

          <div className="DialogFooter" ref={footerRef}>
            <div className="Buttons Span">
              <Button
                disabled={!formValid}
                text={t('modals.signup.buttons.confirm')}
              />
            </div>
          </div>

          <p className="terms">
            {/* <Trans i18nKey="modals.signup.agreement">
                                By signing up, I agree to the <Link href="/privacy"><span>Privacy Policy</span></Link><Link href="/usage"><span>Usage Guidelines</span></Link>.
                            </Trans> */}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default SignupModal
