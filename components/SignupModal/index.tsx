import React, { useState } from 'react'
import { useCookies } from 'react-cookie'

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
    username: string
    email: string
    password: string
    passwordConfirmation: string
}

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const SignupModal = (props: Props) => {
    // Set up form states and error handling
    const [formValid, setFormValid] = useState(false)
    const [errors, setErrors] = useState<ErrorMap>({
        username: '',
        email: '',
        password: '',
        passwordConfirmation: ''
    })

    // Cookies
    const [cookies, setCookies] = useCookies()

    // States
    const [open, setOpen] = useState(false)
 
    // Set up form refs
    const usernameInput = React.createRef<HTMLInputElement>()
    const emailInput = React.createRef<HTMLInputElement>()
    const passwordInput = React.createRef<HTMLInputElement>()
    const passwordConfirmationInput = React.createRef<HTMLInputElement>()
    const form = [usernameInput, emailInput, passwordInput, passwordConfirmationInput]

    function register(event: React.FormEvent) {
        event.preventDefault()

        const body = {
            user: {
                username: usernameInput.current?.value,
                email: emailInput.current?.value,
                password: passwordInput.current?.value,
                password_confirmation: passwordConfirmationInput.current?.value
            }
        }

        if (formValid)
            api.endpoints.users.create(body)
                .then((response) => {
                    // Set cookies
                    setCookies('user', response.data.user, { path: '/'})
                    
                    // Set states
                    accountState.account.authorized = true
                    accountState.account.user = {
                        id: response.data.user.id,
                        username: response.data.user.username
                    }

                    // Close the modal
                    setOpen(false)
                }, (error) => {
                    console.error(error)
                })
                .catch(error => {
                    console.error(error)
                })
    }

    function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault()

        const fieldName = event.target.name
        const value = event.target.value

        if (value.length >= 3) {
            api.check(fieldName, value)
                .then((response) => {
                    processNameCheck(fieldName, value, response.data.available)
                }, (error) => {
                    console.error(error)
                })
        } else {
            validateName(fieldName, value)
        }
    }

    function processNameCheck(fieldName: string, value: string, available: boolean) {
        const newErrors = {...errors}

        if (available) {
            // Continue checking for errors
            newErrors[fieldName] = ''
            setErrors(newErrors)
            setFormValid(true)

            validateName(fieldName, value)
        } else {
            newErrors[fieldName] = `This ${fieldName} is already in use`
            setErrors(newErrors)
            setFormValid(false)
        }
    }

    function validateName(fieldName: string, value: string) {
        let newErrors = {...errors}

        switch(fieldName) {
            case 'username':
                if (value.length < 3)
                    newErrors.username = 'Username must be at least 3 characters'
                else if (value.length > 20)
                    newErrors.username = 'Username must be less than 20 characters'
                else
                    newErrors.username = ''

                break

            case 'email':
                newErrors.email = emailRegex.test(value)
                    ? ''
                    : 'That email address is not valid'
                break

            default:
                break
        }

        setErrors(newErrors)
        setFormValid(validateForm(newErrors))
    }

    function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault()

        const { name, value } = event.target
        let newErrors = {...errors}

        switch(name) {
            case 'password':
                newErrors.password = passwordInput.current?.value.includes(usernameInput.current?.value!)
                    ? 'Your password should not contain your username'
                    : ''
                break

            case 'password':
                newErrors.password = value.length < 8
                    ? 'Password must be at least 8 characters'
                    : ''
                break

            case 'confirm_password':
                newErrors.passwordConfirmation = passwordInput.current?.value === passwordConfirmationInput.current?.value
                    ? ''
                    : 'Your passwords don\'t match'
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

    function openChange(open: boolean) {
        setOpen(open)
        setErrors({
            username: '',
            email: '',
            password: '',
            passwordConfirmation: ''
        })
    }

    return (
        <Dialog.Root open={open} onOpenChange={openChange}>
            <Dialog.Trigger asChild>
                <li className="MenuItem">
                    <span>Sign up</span>
                </li>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Content className="Signup Dialog" onOpenAutoFocus={ (event) => event.preventDefault() }>
                    <div className="DialogHeader">
                        <Dialog.Title className="DialogTitle">Sign up</Dialog.Title>
                        <Dialog.Close className="DialogClose" asChild>
                            <span>
                                <CrossIcon />
                            </span>
                        </Dialog.Close>
                    </div>

                    <form className="form" onSubmit={register}>
                        <Fieldset 
                            fieldName="username"
                            placeholder="Username"
                            onChange={handleNameChange}
                            error={errors.username}
                            ref={usernameInput}
                        />

                        <Fieldset 
                            fieldName="email"
                            placeholder="Email address"
                            onChange={handleNameChange}
                            error={errors.email}
                            ref={emailInput}
                        />

                        <Fieldset 
                            fieldName="password"
                            placeholder="Password"
                            onChange={handlePasswordChange}
                            error={errors.password}
                            ref={passwordInput}
                        />

                        <Fieldset 
                            fieldName="confirm_password"
                            placeholder="Password (again)"
                            onChange={handlePasswordChange}
                            error={errors.passwordConfirmation}
                            ref={passwordConfirmationInput}
                        />

                        <Button disabled={!formValid}>Sign up</Button>

                        <Dialog.Description className="terms">
                            By signing up, I agree to the<br /><a href="#">Terms and Conditions</a> and <a href="#">Usage Guidelines</a>.
                        </Dialog.Description>
                    </form>
                </Dialog.Content>
                <Dialog.Overlay className="Overlay" />
            </Dialog.Portal>
        </Dialog.Root>
    )
}


export default SignupModal