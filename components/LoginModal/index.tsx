import React, { useState } from 'react'
import { useCookies } from 'react-cookie'
import { AxiosResponse } from 'axios'

import * as Dialog from '@radix-ui/react-dialog'

import api from '~utils/api'
import { accountState } from '~utils/accountState'

import Button from '~components/Button'
import Fieldset from '~components/Fieldset'

import CrossIcon from '~public/icons/Cross.svg'
import './index.scss'

interface Props {}

interface ErrorMap {
    [index: string]: string
    email: string
    password: string
}

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const LoginModal = (props: Props) => {
    // Set up form states and error handling
    const [formValid, setFormValid] = useState(false)
    const [errors, setErrors] = useState<ErrorMap>({
        email: '',
        password: ''
    })

    // Cookies
    const [cookies, setCookies] = useCookies()

    // States
    const [open, setOpen] = useState(false)

    // Set up form refs
    const emailInput: React.RefObject<HTMLInputElement> = React.createRef()
    const passwordInput: React.RefObject<HTMLInputElement> = React.createRef()
    const form: React.RefObject<HTMLInputElement>[] = [emailInput, passwordInput]

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target
        let newErrors = {...errors}

        switch(name) {
            case 'email':
                if (value.length == 0)
                    newErrors.email = 'Please enter your email'
                else if (!emailRegex.test(value))
                    newErrors.email = 'That email address is not valid'
                else
                    newErrors.email = ''
                break

            case 'password':
                newErrors.password = value.length == 0
                    ? 'Please enter your password'
                    : ''
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
            grant_type: 'password'
        }

        if (formValid) {
            api.login(body)
                .then(response => {
                    storeCookieInfo(response)
                    return response.data.user.id
                })
                .then(id => fetchUserInfo(id))
                .then(infoResponse => storeUserInfo(infoResponse))
        }
    }

    function fetchUserInfo(id: string) {
        return api.userInfo(id)
    }

    function storeCookieInfo(response: AxiosResponse) {
        const user = response.data.user

        const cookieObj = {
            user_id: user.id,
            username: user.username,
            access_token: response.data.access_token
        }

        setCookies('account', cookieObj, { path: '/'})
    }

    function storeUserInfo(response: AxiosResponse) {
        const user = response.data.user

        const cookieObj = {
            picture: user.picture.picture,
            element: user.picture.element,
            language: user.language,
        }

        setCookies('user', cookieObj, { path: '/'})

        accountState.account.language = user.language
        accountState.account.user = {
            id: user.id,
            username: user.username,
            picture: user.picture.picture,
            element: user.picture.element
        }

        accountState.account.authorized = true
        setOpen(false)
    }

    function openChange(open: boolean) {
        setOpen(open)
        setErrors({
            email: '',
            password: ''
        })
    }

    return (
        <Dialog.Root open={open} onOpenChange={openChange}>
            <Dialog.Trigger asChild>
                <li className="MenuItem">
                    <span>Log in</span>
                </li>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Content className="Login Dialog" onOpenAutoFocus={ (event) => event.preventDefault() }>
                    <div className="DialogHeader">
                        <Dialog.Title className="DialogTitle">Log in</Dialog.Title>
                        <Dialog.Close className="DialogClose" asChild>
                            <span>
                                <CrossIcon />
                            </span>
                        </Dialog.Close>
                    </div>

                    <form className="form" onSubmit={login}>
                        <Fieldset 
                            fieldName="email"
                            placeholder="Email address"
                            onChange={handleChange}
                            error={errors.email}
                            ref={emailInput}
                        />

                        <Fieldset 
                            fieldName="password"
                            placeholder="Password"
                            onChange={handleChange}
                            error={errors.password}
                            ref={passwordInput}
                        />

                        <Button disabled={false}>Log in</Button>
                    </form>
                </Dialog.Content>
                <Dialog.Overlay className="Overlay" />
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default LoginModal