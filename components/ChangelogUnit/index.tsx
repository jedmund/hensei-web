import React from 'react'

import './index.scss'

interface Props {
  id: string
  name: string
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

const ChangelogUnit = ({ id, type, image, name }: Props) => {
  function generateImageUrl() {
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
    <div className="ChangelogUnit">
      <img alt={name} src={generateImageUrl()} />
      <h4>{name}</h4>
    </div>
  )
}

ChangelogUnit.defaultProps = defaultProps

export default ChangelogUnit
