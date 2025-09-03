'use client'
import React, { useEffect, useState } from 'react'
import { getCookie } from 'cookies-next'

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
    fetchItem()
  }, [id, type])

  async function fetchItem() {
    try {
      let endpoint = ''
      
      switch (type) {
        case 'character':
          endpoint = `/api/characters/${id}`
          break
        case 'weapon':
          endpoint = `/api/weapons/${id}`
          break
        case 'summon':
          endpoint = `/api/summons/${id}`
          break
        case 'raid':
          endpoint = `/api/raids/${id}`
          break
        default:
          return
      }
      
      const response = await fetch(endpoint)
      
      if (response.ok) {
        const data = await response.json()
        setItem(data)
      }
    } catch (error) {
      console.error(`Error fetching ${type} ${id}:`, error)
    }
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
