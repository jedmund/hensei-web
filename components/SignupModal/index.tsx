import React, { useContext, useState } from 'react'
import { withCookies, Cookies } from 'react-cookie'
import { createPortal } from 'react-dom'

import AppContext from '~context/AppContext'
import api from '~utils/api'

import Button from '~components/Button'
import Fieldset from '~components/Fieldset'
import Modal from '~components/Modal'
import Overlay from '~components/Overlay'

import './index.scss'

interface Props {
    cookies: Cookies
    close: () => void
}

interface ErrorMap {
    [index: string]: string
    username: string
    email: string
    password: string
    passwordConfirmation: string
}

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const SignupModal = (props: Props) => {
    const { setAuthenticated } = useContext(AppContext)

    const [formValid, setFormValid] = useState(false)
    const [errors, setErrors] = useState<ErrorMap>({
        username: '',
        email: '',
        password: '',
        passwordConfirmation: ''
    })
 
    const usernameInput = React.createRef<HTMLInputElement>()
    const emailInput = React.createRef<HTMLInputElement>()
    const passwordInput = React.createRef<HTMLInputElement>()
    const passwordConfirmationInput = React.createRef<HTMLInputElement>()
    const form = [usernameInput, emailInput, passwordInput, passwordConfirmationInput]

    function check(event: React.ChangeEvent<HTMLInputElement>) {
        const name = event.target.name
        const value = event.target.value

        if (value.length > 0 && errors[name].length == 0) {
            const newErrors = {...errors}
            
            api.check(name, value)
                .then((response) => {
                    if (!response.data.available) {
                        newErrors[name] = `This ${name} is already in use`
                    }

                    setErrors(newErrors)
                }, (error) => {
                    console.log(error)
                })
        }
    }

    function process(event: React.FormEvent) {
        event.preventDefault()

        const body = {
            user: {
                username: usernameInput.current?.value,
                email: emailInput.current?.value,
                password: passwordInput.current?.value,
                password_confirmation: passwordConfirmationInput.current?.value
            }
        }

        if (formValid) {
            api.endpoints.users.create(body)
                .then((response) => {
                    const cookies = props.cookies
                    cookies.set('user', response.data.user, { path: '/'})

                    setAuthenticated(true)

                    props.close()
                }, (error) => {
                    console.log(error)
                })
        }
    }

    function validateForm() {
        let valid = true

        Object.values(form).forEach(
            (input) => input.current?.value.length == 0 && (valid = false)
        )

        Object.values(errors).forEach(
            (error) => error.length > 0 && (valid = false)
        )

        return valid
    }

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault()

        const { name, value } = event.target
        let newErrors = {...errors}

        switch(name) {
            case 'username':
                newErrors.username = value.length < 3 
                    ? 'Username must be at least 3 characters'
                    : ''
                break

            case 'email':
                newErrors.email = emailRegex.test(value)
                    ? ''
                    : 'That email address is not valid'
                break

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
        setFormValid(validateForm())
    }

    return (
        createPortal(
            <div>
                <Modal 
                    title="Sign up" 
                    styleName="SignupForm"
                    close={ () => {} }
                >
                    <form className="form" onSubmit={process}>
                        <div id="fields">
                            <Fieldset 
                                fieldName="username"
                                placeholder="Username"
                                onBlur={check}
                                onChange={handleChange}
                                error={errors.username}
                                ref={usernameInput}
                            />

                            <Fieldset 
                                fieldName="email"
                                placeholder="Email address"
                                onBlur={check}
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

                            <Fieldset 
                                fieldName="confirm_password"
                                placeholder="Password (again)"
                                onChange={handleChange}
                                error={errors.passwordConfirmation}
                                ref={passwordConfirmationInput}
                            />
                        </div>
                        <div id="ModalBottom">
                            <Button disabled={!formValid}>Sign up</Button>
                        </div>
                    </form>
                </Modal>
                <Overlay onClick={props.close} />
            </div>,
            document.body
        )
    )
}


export default withCookies(SignupModal)