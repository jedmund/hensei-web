'use client'
import React, { useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'
import { useTranslation } from 'next-i18next'
import 'fix-date'

import styles from './index.module.scss'
import classNames from 'classnames'

interface Props {
  job?: Job
  gender?: number
  element?: number
  grid: GridArray<GridCharacter>
}

const CHARACTERS_COUNT = 3

const CharacterRep = (props: Props) => {
  // Localization for alt tags
  const { t } = useTranslation('common')
  const locale = (getCookie('NEXT_LOCALE') as string) || 'en'

  // Component state
  const [characters, setCharacters] = useState<GridArray<Character>>({})
  const [grid, setGrid] = useState<GridArray<GridCharacter>>({})

  // On grid update
  useEffect(() => {
    const newCharacters = Array(CHARACTERS_COUNT)
    const gridCharacters = Array(CHARACTERS_COUNT)

    if (props.grid) {
      for (const [key, value] of Object.entries(props.grid)) {
        if (value) {
          newCharacters[value.position] = value.object
          gridCharacters[value.position] = value
        }
      }
    }

    setCharacters(newCharacters)
    setGrid(gridCharacters)
  }, [props.grid])

  // Convert element to string
  function numberToElement() {
    switch (props.element) {
      case 1:
        return 'wind'
      case 2:
        return 'fire'
      case 3:
        return 'water'
      case 4:
        return 'earth'
      case 5:
        return 'dark'
      case 6:
        return 'light'
      default:
        return ''
    }
  }

  // Methods: Image generation
  function generateMCImage() {
    let source = ''

    if (props.job) {
      const slug = props.job.name.en.replaceAll(' ', '-').toLowerCase()
      const gender = props.gender == 1 ? 'b' : 'a'
      source = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/job-portraits/${slug}_${gender}.png`
    }

    return (
      props.job &&
      props.job.id !== '-1' && (
        <img alt={props.job ? props.job?.name[locale] : ''} src={source} />
      )
    )
  }

  function generateGridImage(position: number) {
    let url = ''

    const character = characters[position]
    const gridCharacter = grid[position]

    if (character && gridCharacter) {
      // Change the image based on the uncap level
      let suffix = '01'
      if (gridCharacter.transcendence_step > 0) suffix = '04'
      else if (gridCharacter.uncap_level >= 5) suffix = '03'
      else if (gridCharacter.uncap_level > 2) suffix = '02'

      if (character.element == 0) {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/character-main/${character.granblue_id}_${props.element}.jpg`
      } else {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/character-main/${character.granblue_id}_${suffix}.jpg`
      }
    }

    return characters[position] ? (
      <img alt={characters[position]?.name[locale]} src={url} />
    ) : (
      ''
    )
  }

  // Render
  return (
    <div className={styles.rep}>
      <ul className={styles.characters}>
        <li
          key="characters-job"
          className={classNames({
            [styles.protagonist]: true,
            [styles[`${numberToElement()}`]]: true,
            [styles.empty]: !props.job || props.job.id === '-1',
          })}
        >
          {generateMCImage()}
        </li>
        {Array.from(Array(CHARACTERS_COUNT)).map((x, i) => {
          return (
            <li key={`characters-${i}`} className={styles.character}>
              {generateGridImage(i)}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default CharacterRep
