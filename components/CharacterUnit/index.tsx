import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'
import classnames from 'classnames'

import Button from '~components/Button'
import CharacterHovercard from '~components/CharacterHovercard'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
} from '~components/ContextMenu'
import ContextMenuItem from '~components/ContextMenuItem'
import SearchModal from '~components/SearchModal'
import UncapIndicator from '~components/UncapIndicator'

import { appState } from '~utils/appState'

import PlusIcon from '~public/icons/Add.svg'
import SettingsIcon from '~public/icons/Settings.svg'

import type { SearchableObject } from '~types'

import './index.scss'

interface Props {
  gridCharacter?: GridCharacter
  position: number
  editable: boolean
  updateObject: (object: SearchableObject, position: number) => void
  updateUncap: (id: string, position: number, uncap: number) => void
}

const CharacterUnit = (props: Props) => {
  const { t } = useTranslation('common')

  const { party, grid } = useSnapshot(appState)

  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  const [imageUrl, setImageUrl] = useState('')

  const classes = classnames({
    CharacterUnit: true,
    editable: props.editable,
    filled: props.gridCharacter !== undefined,
  })

  const gridCharacter = props.gridCharacter
  const character = gridCharacter?.object

  useEffect(() => {
    generateImageUrl()
  })

  function generateImageUrl() {
    let imgSrc = ''

    if (props.gridCharacter) {
      const character = props.gridCharacter.object!

      // Change the image based on the uncap level
      let suffix = '01'
      if (props.gridCharacter.uncap_level == 6) suffix = '04'
      else if (props.gridCharacter.uncap_level == 5) suffix = '03'
      else if (props.gridCharacter.uncap_level > 2) suffix = '02'

      // Special casing for Lyria (and Young Cat eventually)
      if (props.gridCharacter.object.granblue_id === '3030182000') {
        let element = 1
        if (grid.weapons.mainWeapon && grid.weapons.mainWeapon.element) {
          element = grid.weapons.mainWeapon.element
        } else if (party.element != 0) {
          element = party.element
        }

        suffix = `${suffix}_0${element}`
      }

      imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/chara-main/${character.granblue_id}_${suffix}.jpg`
    }

    setImageUrl(imgSrc)
  }

  function passUncapData(uncap: number) {
    if (props.gridCharacter)
      props.updateUncap(props.gridCharacter.id, props.position, uncap)
  }

  const image = (
    <div className="CharacterImage">
      <img alt={character?.name.en} className="grid_image" src={imageUrl} />
      {props.editable ? (
        <span className="icon">
          <PlusIcon />
        </span>
      ) : (
        ''
      )}
    </div>
  )

  const editableImage = (
    <SearchModal
      placeholderText={t('search.placeholders.character')}
      fromPosition={props.position}
      object="characters"
      send={props.updateObject}
    >
      {image}
    </SearchModal>
  )

  const contextMenu = () => {
    return props.editable && gridCharacter && gridCharacter.id ? (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Button accessoryIcon={<SettingsIcon />} className="Options" />
        </ContextMenuTrigger>
        <ContextMenuContent align="start">
          <ContextMenuItem>Modify character</ContextMenuItem>
          <ContextMenuItem>Remove from grid</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ) : (
      ''
    )
  }

  const unitContent = (
    <div className={classes}>
      {contextMenu()}
      {props.editable ? editableImage : image}
      {gridCharacter && character ? (
        <UncapIndicator
          type="character"
          flb={character.uncap.flb || false}
          ulb={character.uncap.ulb || false}
          uncapLevel={gridCharacter.uncap_level}
          updateUncap={passUncapData}
          special={character.special}
        />
      ) : (
        ''
      )}
      <h3 className="CharacterName">{character?.name[locale]}</h3>
    </div>
  )

  const withHovercard = (
    <CharacterHovercard gridCharacter={gridCharacter!}>
      {unitContent}
    </CharacterHovercard>
  )

  return gridCharacter && !props.editable ? withHovercard : unitContent
}

export default CharacterUnit
