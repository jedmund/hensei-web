import React from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import * as HoverCard from '@radix-ui/react-hover-card'

import WeaponLabelIcon from '~components/WeaponLabelIcon'
import UncapIndicator from '~components/UncapIndicator'

import './index.scss'

interface Props {
  gridCharacter: GridCharacter
  children: React.ReactNode
}

interface KeyNames {
  [key: string]: {
    en: string
    jp: string
  }
}

const CharacterHovercard = (props: Props) => {
  const router = useRouter()
  const { t } = useTranslation('common')
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  const Element = ['null', 'wind', 'fire', 'water', 'earth', 'dark', 'light']
  const Proficiency = [
    'none',
    'sword',
    'dagger',
    'axe',
    'spear',
    'bow',
    'staff',
    'fist',
    'harp',
    'gun',
    'katana',
  ]

  const tintElement = Element[props.gridCharacter.object.element]
  const wikiUrl = `https://gbf.wiki/${props.gridCharacter.object.name.en.replaceAll(
    ' ',
    '_'
  )}`

  function characterImage() {
    let imgSrc = ''

    if (props.gridCharacter) {
      const character = props.gridCharacter.object

      // Change the image based on the uncap level
      let suffix = '01'
      if (props.gridCharacter.uncap_level == 6) suffix = '04'
      else if (props.gridCharacter.uncap_level == 5) suffix = '03'
      else if (props.gridCharacter.uncap_level > 2) suffix = '02'

      imgSrc = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/chara-grid/${character.granblue_id}_${suffix}.jpg`
    }

    return imgSrc
  }

  return (
    <HoverCard.Root>
      <HoverCard.Trigger>{props.children}</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content className="Weapon Hovercard">
          <div className="top">
            <div className="title">
              <h4>{props.gridCharacter.object.name[locale]}</h4>
              <img
                alt={props.gridCharacter.object.name[locale]}
                src={characterImage()}
              />
            </div>
            <div className="subInfo">
              <div className="icons">
                <WeaponLabelIcon
                  labelType={Element[props.gridCharacter.object.element]}
                />
                <WeaponLabelIcon
                  labelType={
                    Proficiency[
                      props.gridCharacter.object.proficiency.proficiency1
                    ]
                  }
                />
                {props.gridCharacter.object.proficiency.proficiency2 ? (
                  <WeaponLabelIcon
                    labelType={
                      Proficiency[
                        props.gridCharacter.object.proficiency.proficiency2
                      ]
                    }
                  />
                ) : (
                  ''
                )}
              </div>
              <UncapIndicator
                type="character"
                ulb={props.gridCharacter.object.uncap.ulb || false}
                flb={props.gridCharacter.object.uncap.flb || false}
                special={false}
              />
            </div>
          </div>

          <a className={`Button ${tintElement}`} href={wikiUrl} target="_new">
            {t('buttons.wiki')}
          </a>
          <HoverCard.Arrow />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}

export default CharacterHovercard
