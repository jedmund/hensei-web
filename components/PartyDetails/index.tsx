import React, { useState } from 'react'
import Head from 'next/head'
import { useSnapshot } from 'valtio'
import Linkify from 'react-linkify'
import classNames from 'classnames'

import CharLimitedFieldset from '~components/CharLimitedFieldset'
import RaidDropdown from '~components/RaidDropdown'
import TextFieldset from '~components/TextFieldset'

import { appState } from '~utils/appState'

import './index.scss'

// Props
interface Props {
    editable: boolean
    updateCallback: (name?: string, description?: string, raid?: Raid) => void
}

const PartyDetails = (props: Props) => {
    const { party, raids } = useSnapshot(appState)

    const nameInput = React.createRef<HTMLInputElement>()
    const descriptionInput = React.createRef<HTMLTextAreaElement>()
    const raidSelect = React.createRef<HTMLSelectElement>()

    const readOnlyClasses = classNames({
        'PartyDetails': true,
        'ReadOnly': true,
        'Visible': !party.detailsVisible
    })

    const editableClasses = classNames({
        'PartyDetails': true,
        'Editable': true,
        'Visible': party.detailsVisible
    })

    const [errors, setErrors] = useState<{ [key: string]: string }>({
        name: '',
        description: ''
    })

    function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault()

        const { name, value } = event.target
        let newErrors = errors

        setErrors(newErrors)
    }

    function handleTextAreaChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        event.preventDefault()

        const { name, value } = event.target
        let newErrors = errors

        setErrors(newErrors)
    }

    function updateDetails(event: React.ChangeEvent) {
        const nameValue = nameInput.current?.value
        const descriptionValue = descriptionInput.current?.value
        const raid = raids.find(raid => raid.id == raidSelect.current?.value)

        props.updateCallback(nameValue, descriptionValue, raid)
    }

    const editable = (
        <section className={editableClasses}>
            <CharLimitedFieldset 
                fieldName="name"
                placeholder="Name your team"
                value={party.name}
                limit={50}
                onBlur={updateDetails}
                onChange={handleInputChange}
                error={errors.name}
                ref={nameInput}
            />
            <RaidDropdown 
                allOption={false}
                selected={party.raid?.id || ''}
                onBlur={updateDetails}
                ref={raidSelect}
            />
            <TextFieldset 
                fieldName="name"
                placeholder={"Write your notes here\n\n\nWatch out for the 50% trigger!\nMake sure to click Fediel’s 1 first\nGood luck with RNG!"}
                value={party.description}
                onBlur={updateDetails}
                onChange={handleTextAreaChange}
                error={errors.description}
                ref={descriptionInput}
            />
        </section>
    )

    const readOnly = (
        <section className={readOnlyClasses}>
            { (party.name) ? <h1>{party.name}</h1> : '' }
            { (party.raid) ? <div className="Raid">{party.raid.name.en}</div> : '' }
            { (party.description) ? <p><Linkify>{party.description}</Linkify></p> : '' }
        </section>
    )

    const generateTitle = () => {
        let title = ''

        const username = (party.user != null) ? `@${party.user?.username}` : 'Anonymous'

        if (party.name != null)
            title = `${party.name} by ${username}`
        else if (party.name == null && party.editable)
            title = "New Team"
        else
            title = `Untitled team by ${username}`

        return title
    }

    return (
        <div>
            <Head>
                <title>
                    {generateTitle()}

                    <meta property="og:title" content={generateTitle()} />
                    <meta property="og:description" content={ (party.description) ? party.description : '' } />
                    <meta property="og:url" content="https://app.granblue.team" />
                    <meta property="og:type" content="website" />

                    <meta name="twitter:card" content="summary_large_image" />
                    <meta property="twitter:domain" content="app.granblue.team" />
                    <meta name="twitter:title" content={generateTitle()} />
                    <meta name="twitter:description" content={ (party.description) ? party.description : '' } />
                </title>
            </Head>
            {readOnly}
            {editable}
        </div>
    )
}

export default PartyDetails
