import React, { useState } from 'react'
import { useSnapshot } from 'valtio'
import classNames from 'classnames'

import CharLimitedFieldset from '~components/CharLimitedFieldset'
import TextFieldset from '~components/TextFieldset'

import { appState } from '~utils/appState'

import './index.scss'
import RaidDropdown from '~components/RaidDropdown'

// Props
interface Props {
    editable: boolean
    updateCallback: (name?: string, description?: string, raid?: Raid) => void
}

const PartyDetails = (props: Props) => {
    const appSnapshot = useSnapshot(appState)

    const nameInput = React.createRef<HTMLInputElement>()
    const descriptionInput = React.createRef<HTMLTextAreaElement>()
    const raidSelect = React.createRef<HTMLSelectElement>()

    const readOnlyClasses = classNames({
        'PartyDetails': true,
        'ReadOnly': true,
        'Visible': !appSnapshot.party.detailsVisible
    })

    const editableClasses = classNames({
        'PartyDetails': true,
        'Editable': true,
        'Visible': appSnapshot.party.detailsVisible
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
        const raid = appSnapshot.raids.find(raid => raid.id == raidSelect.current?.value)

        props.updateCallback(nameValue, descriptionValue, raid)
    }

    const editable = (
        <section className={editableClasses}>
            <CharLimitedFieldset 
                fieldName="name"
                placeholder="Name your team"
                value={appSnapshot.party.name}
                limit={50}
                onBlur={updateDetails}
                onChange={handleInputChange}
                error={errors.name}
                ref={nameInput}
            />
            <RaidDropdown 
                selected={appSnapshot.party.raid?.id || ''}
                onBlur={updateDetails}
                ref={raidSelect}
            />
            <TextFieldset 
                fieldName="name"
                placeholder={"Write your notes here\n\n\nWatch out for the 50% trigger!\nMake sure to click Fediel’s 1 first\nGood luck with RNG!"}
                value={appSnapshot.party.description}
                onBlur={updateDetails}
                onChange={handleTextAreaChange}
                error={errors.description}
                ref={descriptionInput}
            />
        </section>
    )

    const readOnly = (
        <section className={readOnlyClasses}>
            <h1>{ (appSnapshot.party.name) ? appSnapshot.party.name : 'No title' }</h1>
            { (appSnapshot.party.raid) ? <div className="Raid">{appSnapshot.party.raid.name.en}</div> : '' }
            <p>{ (appSnapshot.party.description) ? appSnapshot.party.description : '' }</p>
        </section>
    )

    return (
        <div>
            {readOnly}
            {editable}
        </div>
    )
}

export default PartyDetails
