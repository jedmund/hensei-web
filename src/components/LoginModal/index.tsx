import React, { useState } from 'react'
import { withCookies, Cookies } from 'react-cookie'
import { createPortal } from 'react-dom'
import api from '~utils/api'

import Button from '~components/Button'
import Fieldset from '~components/Fieldset'
import Modal from '~components/Modal'
import Overlay from '~components/Overlay'

import './index.css'

import New from '../../../assets/new'

interface Props {
    cookies: Cookies
    close: () => void
}

interface ErrorMap {
    [index: string]: string
    email: string
    password: string
}

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const LoginModal = (props: Props) => {
    const emailInput: React.RefObject<HTMLInputElement> = React.createRef()
    const passwordInput: React.RefObject<HTMLInputElement> = React.createRef()
    const form: React.RefObject<HTMLInputElement>[] = [emailInput, passwordInput]

    const [formValid, setFormValid] = useState(false)
    const [errors, setErrors] = useState<ErrorMap>({
        email: '',
        password: ''
    })

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault()

        const { name, value } = event.target
        let newErrors = errors

        switch(name) {
            case 'email':
                errors.email = emailRegex.test(value)
                    ? ''
                    : 'That email address is not valid'
                break

            case 'password':
                errors.password = value.length == 0
                    ? 'Please enter your password'
                    : ''
                break

            default:
                break
        }

        setErrors(newErrors)
        setFormValid(validateForm())
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

    function submit(event: React.FormEvent) {
        event.preventDefault()

        const body = {
            email: emailInput.current?.value,
            password: passwordInput.current?.value,
            grant_type: 'password'
        }

        if (formValid) {
            api.login(body)
                .then((response) => {
                    const cookies = props.cookies

                    const cookieObj = {
                        user_id: response.data.user.id,
                        username: response.data.user.username,
                        access_token: response.data.access_token
                    }

                    cookies.set('user', cookieObj, { path: '/'})
                    props.close()
                }, (error) => {
                    console.error(error)
                })
        }
    }

    return (
        createPortal(
            <div>
                <Modal styleName="LoginForm">
                    <div id="ModalTop">
                        <h1>Log in</h1>
                        <i className='close' onClick={props.close}><New /></i>
                    </div>
                    <form className="form" onSubmit={submit}>
                        <div id="fields">
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
                        </div>
                        <div id="ModalBottom">
                            <a>Forgot your password?</a>
                            <Button color="blue" disabled={!formValid}>Log in</Button>
                        </div>
                    </form>
                </Modal>
                <Overlay onClick={props.close} />
            </div>,
            document.body
        )
    )
}

export default withCookies(LoginModal)