import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import api from '~utils/api'

import './index.scss'

interface Props {
  id: string
  type: 'character' | 'summon' | 'weapon'
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
  // Router
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

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

  const imageUrl = () => {
    let src = ''

    switch (type) {
      case 'character':
        src = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/chara-grid/${id}_${image}.jpg`
        break
      case 'weapon':
        src = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${id}.jpg`
        break
      case 'summon':
        src = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${id}.jpg`
        break
    }

    return src
  }

  return (
    <div className="ChangelogUnit" key={id}>
      <img alt={item ? item.name[locale] : ''} src={imageUrl()} />
      <h4>{item ? item.name[locale] : ''}</h4>
    </div>
  )
}

ChangelogUnit.defaultProps = defaultProps

export default ChangelogUnit
