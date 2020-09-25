import React, { useEffect, useState } from 'react'
import { withCookies, Cookies } from 'react-cookie'
import { createPortal } from 'react-dom'
import api from '~utils/api'

import Button from '~components/Button/Button'
import Fieldset from '~components/Fieldset/Fieldset'
import Modal from '~components/Modal/Modal'
import Overlay from '~components/Overlay/Overlay'

import './SignupModal.css'

import New from '../../../assets/new'

interface Props {
    cookies: Cookies
    close: () => void
}

interface State {
    formValid: boolean
    errors: ErrorMap
}

interface ErrorMap {
    [index: string]: string
    username: string
    email: string
    password: string
    passwordConfirmation: string
}

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

class SignupModal extends React.Component<Props, State> {
    usernameInput: React.RefObject<HTMLInputElement>
    emailInput: React.RefObject<HTMLInputElement>
    passwordInput: React.RefObject<HTMLInputElement>
    passwordConfirmationInput: React.RefObject<HTMLInputElement>
    form: React.RefObject<HTMLInputElement>[]

    constructor(props: Props) {
        super(props)
        this.state = {
            formValid: false,
            errors: {
                username: '',
                email: '',
                password: '',
                passwordConfirmation: ''
            }
        }
        
        this.usernameInput = React.createRef()
        this.emailInput = React.createRef()
        this.passwordInput = React.createRef()
        this.passwordConfirmationInput = React.createRef()
        this.form = [this.usernameInput, this.emailInput, this.passwordInput, this.passwordConfirmationInput]
    }

    check = (event: React.ChangeEvent<HTMLInputElement>) => {
        const name = event.target.name
        const value = event.target.value

        if (value.length > 0 && this.state.errors[name].length == 0) {
            const errors = this.state.errors
            
            api.check(name, value)
                .then((response) => {
                    if (!response.data.available) {
                        errors[name] = `This ${name} is already in use`
                    }

                    this.setState({ errors: errors })
                }, (error) => {
                    console.log(error)
                })
        }
    }

    process = (event: React.FormEvent) => {
        event.preventDefault()

        const body = {
            user: {
                username: this.usernameInput.current?.value,
                email: this.emailInput.current?.value,
                password: this.passwordInput.current?.value,
                password_confirmation: this.passwordConfirmationInput.current?.value
            }
        }

        if (this.state.formValid) {
            api.endpoints.users.create(body)
                .then((response) => {
                    const cookies = this.props.cookies
                    cookies.set('user', response.data.user, { path: '/'})
                }, (error) => {
                    console.log(error)
                })
        }
    }

    validateForm = () => {
        let valid = true

        Object.values(this.form).forEach(
            (input) => input.current?.value.length == 0 && (valid = false)
        )

        Object.values(this.state.errors).forEach(
            (error) => error.length > 0 && (valid = false)
        )

        return valid
    }

    handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault()

        const { name, value } = event.target
        const errors = this.state.errors

        switch(name) {
            case 'username':
                errors.username = value.length < 3 
                    ? 'Username must be at least 3 characters'
                    : ''
                break

            case 'email':
                errors.email = emailRegex.test(value)
                    ? ''
                    : 'That email address is not valid'
                break

            case 'password':
                errors.password = value.length < 8
                    ? 'Password must be at least 8 characters'
                    : ''
                break

            case 'confirm_password':
                errors.passwordConfirmation = this.passwordInput.current?.value === this.passwordConfirmationInput.current?.value
                    ? ''
                    : 'Your passwords don\'t match'
                break

            default:
                break
        }

        this.setState({ errors: errors })
        this.setState({ formValid: this.validateForm() })
    }

    render() {
        const errors = this.state.errors
        return (
            createPortal(
                <div>
                    <Modal styleName="SignupForm">
                        <div id="ModalTop">
                            <h1>Sign up</h1>
                            <i className='close' onClick={this.props.close}><New /></i>
                        </div>
                        <form className="form" onSubmit={this.process}>
                            <div id="fields">
                                <Fieldset 
                                    fieldName="username"
                                    placeholder="Username"
                                    onBlur={this.check}
                                    onChange={this.handleChange}
                                    error={errors.username}
                                    ref={this.usernameInput}
                                />

                                <Fieldset 
                                    fieldName="email"
                                    placeholder="Email address"
                                    onBlur={this.check}
                                    onChange={this.handleChange}
                                    error={errors.email}
                                    ref={this.emailInput}
                                />

                                <Fieldset 
                                    fieldName="password"
                                    placeholder="Password"
                                    onChange={this.handleChange}
                                    error={errors.password}
                                    ref={this.passwordInput}
                                />

                                <Fieldset 
                                    fieldName="confirm_password"
                                    placeholder="Password (again)"
                                    onChange={this.handleChange}
                                    error={errors.passwordConfirmation}
                                    ref={this.passwordConfirmationInput}
                                />
                            </div>
                            <div id="ModalBottom">
                                <Button color="blue" disabled={!this.state.formValid}>Sign up</Button>
                            </div>
                        </form>
                    </Modal>
                    <Overlay onClick={this.props.close} />
                </div>,
                document.body
            )
        )
    }
}


export default withCookies(SignupModal)