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
}

const PartyDetails = (props: Props) => {
    const appSnapshot = useSnapshot(appState)

    const nameInput = React.createRef<HTMLInputElement>()
    const descriptionInput = React.createRef<HTMLTextAreaElement>()

    const readOnlyClasses = classNames({
        'Details': true,
        'ReadOnly': true,
        'Visible': !appSnapshot.party.detailsVisible
    })

    const editableClasses = classNames({
        'Details': true,
        'Editable': true,
        'Visible': appSnapshot.party.detailsVisible
    })

    const [errors, setErrors] = useState<{ [key: string]: string }>({
        name: '',
        description: ''
    })

    function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        console.log(event)

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

    const editable = (
        <section className={editableClasses}>
            <CharLimitedFieldset 
                fieldName="name"
                placeholder="Name your team"
                value={appSnapshot.party.name}
                limit={50}
                onBlur={ () => {} }
                onChange={handleInputChange}
                error={errors.name}
                ref={nameInput}
            />
            <RaidDropdown />
            <select>
                <option>Belial</option>
                <option>Beelzebub</option>
                <option>Lucifer (Hard)</option>
            </select>
            <TextFieldset 
                fieldName="name"
                placeholder={"Write your notes here\n\n\nWatch out for the 50% trigger!\nMake sure to click Fediel’s 1 first\nGood luck with RNG!"}
                value={appSnapshot.party.description}
                onBlur={ () => {} }
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
