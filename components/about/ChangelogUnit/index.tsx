'use client'
import React, { useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'
import api from '~utils/api'

import styles from './index.module.scss'

interface Props {
  id: string
  type: 'character' | 'summon' | 'weapon' | 'raid' | 'job'
  image?: '01' | '02' | '03' | '04'
}

const defaultProps = {
  active: false,
  blended: false,
  contained: false,
  buttonSize: 'medium' as const,
  image: '01',
}

const ChangelogUnit = ({ id, type, image }: Props) => {
  // Locale
  const locale = (getCookie('NEXT_LOCALE') as string) || 'en'

  // State
  const [item, setItem] = useState<Character | Weapon | Summon>()

  // Hooks
  useEffect(() => {
    fetch()
  }, [])

  async function fetch() {
    switch (type) {
      case 'character':
        const character = await fetchCharacter()
        setItem(character.data)
        break

      case 'weapon':
        const weapon = await fetchWeapon()
        setItem(weapon.data)
        break

      case 'summon':
        const summon = await fetchSummon()
        setItem(summon.data)
        break

      case 'raid':
        const raid = await fetchRaid()
        setItem(raid.data)
        break
    }
  }

  async function fetchCharacter() {
    return api.endpoints.characters.getOne({ id: id })
  }

  async function fetchWeapon() {
    return api.endpoints.weapons.getOne({ id: id })
  }

  async function fetchSummon() {
    return api.endpoints.summons.getOne({ id: id })
  }

  async function fetchRaid() {
    return api.endpoints.raids.getOne({ id: id })
  }

  const imageUrl = () => {
    let src = ''

    switch (type) {
      case 'character':
        src = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/character-grid/${id}_${image}.jpg`
        break
      case 'weapon':
        src =
          image === '03'
            ? `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${id}_${image}.jpg`
            : `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${id}.jpg`
        break
      case 'summon':
        src =
          image === '04'
            ? `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${id}_${image}.jpg`
            : `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${id}.jpg`
        break

      case 'raid':
        src = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/raids/${id}.png`
        break
    }

    return src
  }

  return (
    <div className={styles.unit} key={id}>
      <img alt={item ? item.name[locale] : ''} src={imageUrl()} />
      <h4>{item ? item.name[locale] : ''}</h4>
    </div>
  )
}

ChangelogUnit.defaultProps = defaultProps

export default ChangelogUnit
