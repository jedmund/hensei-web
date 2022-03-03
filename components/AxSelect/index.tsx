import React, { useEffect, useState } from 'react'
import classNames from 'classnames'

import { axData } from '~utils/axData'

import './index.scss'

interface Props {
    axType: number
    currentSkills?: SimpleAxSkill[],
    sendValues: (primaryAxModifier: number, primaryAxValue: number, secondaryAxModifier: number, secondaryAxValue: number) => void
}

const AXSelect = (props: Props) => {
    // Refs
    const primaryAxModifierSelect = React.createRef<HTMLSelectElement>()
    const primaryAxValueInput = React.createRef<HTMLInputElement>()
    const secondaryAxModifierSelect = React.createRef<HTMLSelectElement>()
    const secondaryAxValueInput = React.createRef<HTMLInputElement>()

    // States
    const [primaryAxModifier, setPrimaryAxModifier] = useState(-1)
    const [secondaryAxModifier, setSecondaryAxModifier] = useState(-1)
    const [primaryAxValue, setPrimaryAxValue] = useState(0.0)
    const [secondaryAxValue, setSecondaryAxValue] = useState(0.0)

    useEffect(() => {
        if (props.currentSkills && props.currentSkills[0]) {
            if (props.currentSkills[0].modifier != null)
                setPrimaryAxModifier(props.currentSkills[0].modifier)

            setPrimaryAxValue(props.currentSkills[0].strength)
        }

        if (props.currentSkills && props.currentSkills[1]) {
            if (props.currentSkills[1].modifier != null)
                setSecondaryAxModifier(props.currentSkills[1].modifier)

            setSecondaryAxValue(props.currentSkills[1].strength)
        }
    }, [props.currentSkills])

    useEffect(() => {
        props.sendValues(primaryAxModifier, primaryAxValue, secondaryAxModifier, secondaryAxValue)
    }, [primaryAxModifier, primaryAxValue, secondaryAxModifier, secondaryAxValue])

    // Classes
    const secondarySetClasses = classNames({
        'AXSet': true,
        'hidden': primaryAxModifier < 0
    })

    function generateOptions(modifierSet: number) {
        const axOptions = axData[props.axType - 1]

        let axOptionElements: React.ReactNode[] = []
        if (modifierSet == 0) {
            axOptionElements = axOptions.map((ax, i) => {
                return (
                    <option key={i} value={ax.id}>{ax.name.en}</option>
                )
            })
        } else {
            // If we are loading data from the server, state doesn't set before render,
            // so our defaultValue is undefined.
            let modifier = -1;
            if (primaryAxModifier >= 0)
                modifier = primaryAxModifier
            else if (props.currentSkills)
                modifier = props.currentSkills[0].modifier

            if (modifier >= 0 && axOptions[modifier]) {
                const primarySkill = axOptions[modifier]

                if (primarySkill.secondary) {
                    const secondaryAxOptions = primarySkill.secondary
                    axOptionElements = secondaryAxOptions.map((ax, i) => {
                        return (
                            <option key={i} value={ax.id}>{ax.name.en}</option>
                        )
                    })
                }
            }
        }

        axOptionElements?.unshift(<option key={-1} value={-1}>No AX Skill</option>)
        return axOptionElements
    }

    function handleSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const value = parseInt(event.target.value)

        if (primaryAxModifierSelect.current == event.target) {
            setPrimaryAxModifier(value)

            if (primaryAxValueInput.current && secondaryAxModifierSelect.current && secondaryAxValueInput.current) {
                setupInput(axData[props.axType - 1][value], primaryAxValueInput.current)
                
                secondaryAxModifierSelect.current.value = "-1"
                secondaryAxValueInput.current.value = ""
            }
        } else {
            setSecondaryAxModifier(value)

            const primaryAxSkill = axData[props.axType - 1][primaryAxModifier]
            const currentAxSkill = (primaryAxSkill.secondary) ? 
                primaryAxSkill.secondary.find(skill => skill.id == value) : undefined

            if (secondaryAxValueInput.current)
                setupInput(currentAxSkill, secondaryAxValueInput.current)
        }
    }

    function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        if (primaryAxValueInput.current == event.target) {
            setPrimaryAxValue(parseFloat(event.target.value))
        } else {
            setSecondaryAxValue(parseFloat(event.target.value))
        }
    }

    function setupInput(ax: AxSkill | undefined, element: HTMLInputElement) {
        if (ax) {
            const rangeString = `${ax.minValue}~${ax.maxValue}${ax.suffix || ''}`

            element.disabled = false
            element.placeholder = rangeString
            element.min = `${ax.minValue}`
            element.max = `${ax.maxValue}`
            element.step = (ax.suffix) ? "0.5" : "1"
        } else {
            if (primaryAxValueInput.current && secondaryAxValueInput.current) {
                if (primaryAxValueInput.current == element) {
                    primaryAxValueInput.current.disabled = true
                    primaryAxValueInput.current.placeholder = ''   
                }

                secondaryAxValueInput.current.disabled = true
                secondaryAxValueInput.current.placeholder = ''
            }
        }
    }

    return (
        <div className="AXSelect">
            <div className="AXSet">
                <select key="ax1" defaultValue={ (props.currentSkills && props.currentSkills[0]) ? props.currentSkills[0].modifier : -1 } onChange={handleSelectChange} ref={primaryAxModifierSelect}>{ generateOptions(0) }</select>
                <input defaultValue={ (props.currentSkills && props.currentSkills[0]) ? props.currentSkills[0].strength : 0 } className="Input" type="number" onChange={handleInputChange} ref={primaryAxValueInput} disabled />
            </div>

            <div className={secondarySetClasses}>
                <select key="ax2" defaultValue={ (props.currentSkills && props.currentSkills[1]) ? props.currentSkills[1].modifier : -1 } onChange={handleSelectChange} ref={secondaryAxModifierSelect}>{ generateOptions(1) }</select>
                <input defaultValue={ (props.currentSkills && props.currentSkills[1]) ? props.currentSkills[1].strength : 0 } className="Input" type="number" onChange={handleInputChange} ref={secondaryAxValueInput} disabled />
            </div>
        </div>
    )
}

export default AXSelect