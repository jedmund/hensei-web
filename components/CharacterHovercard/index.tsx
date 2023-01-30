import React from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import {
  Hovercard,
  HovercardContent,
  HovercardTrigger,
} from '~components/Hovercard'
import WeaponLabelIcon from '~components/WeaponLabelIcon'
import UncapIndicator from '~components/UncapIndicator'

import {
  overMastery,
  aetherialMastery,
  permanentMastery,
} from '~data/overMastery'
import { ExtendedMastery } from '~types'

import './index.scss'
import { characterAwakening } from '~data/awakening'

interface Props {
  gridCharacter: GridCharacter
  children: React.ReactNode
  onTriggerClick: () => void
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

  function masteryElement(dictionary: ItemSkill[], mastery: ExtendedMastery) {
    const canonicalMastery = dictionary.find(
      (item) => item.id === mastery.modifier
    )

    if (canonicalMastery) {
      return (
        <li className="ExtendedMastery">
          <img
            alt={canonicalMastery.name[locale]}
            src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/mastery/${canonicalMastery.slug}.png`}
          />
          <span>
            <strong>{canonicalMastery.name[locale]}</strong>&nbsp;
            {`+${mastery.strength}${canonicalMastery.suffix}`}
          </span>
        </li>
      )
    }
  }

  const overMasterySection = () => {
    if (props.gridCharacter && props.gridCharacter.over_mastery) {
      return (
        <section className="Mastery">
          <h5 className={tintElement}>
            {t('modals.characters.subtitles.ring')}
          </h5>
          <ul>
            {[...Array(4)].map((e, i) => {
              const ringIndex = i + 1
              const ringStat: ExtendedMastery =
                props.gridCharacter.over_mastery[i]
              if (ringStat && ringStat.modifier && ringStat.modifier > 0) {
                if (ringIndex === 1 || ringIndex === 2) {
                  return masteryElement(overMastery.a, ringStat)
                } else if (ringIndex === 3) {
                  return masteryElement(overMastery.b, ringStat)
                } else {
                  return masteryElement(overMastery.c, ringStat)
                }
              }
            })}
          </ul>
        </section>
      )
    }
  }

  const aetherialMasterySection = () => {
    if (
      props.gridCharacter &&
      props.gridCharacter.aetherial_mastery &&
      props.gridCharacter.aetherial_mastery.modifier > 0
    ) {
      return (
        <section className="Mastery">
          <h5 className={tintElement}>
            {t('modals.characters.subtitles.earring')}
          </h5>
          <ul>
            {masteryElement(
              aetherialMastery,
              props.gridCharacter.aetherial_mastery
            )}
          </ul>
        </section>
      )
    }
  }

  const permanentMasterySection = () => {
    if (props.gridCharacter && props.gridCharacter.perpetuity) {
      return (
        <section className="Mastery">
          <h5 className={tintElement}>
            {t('modals.characters.subtitles.permanent')}
          </h5>
          <ul>
            {[...Array(4)].map((e, i) => {
              return masteryElement(permanentMastery, {
                modifier: i + 1,
                strength: permanentMastery[i].maxValue,
              })
            })}
          </ul>
        </section>
      )
    }
  }

  const awakeningSection = () => {
    const gridAwakening = props.gridCharacter.awakening
    const awakening = characterAwakening.find(
      (awakening) => awakening.id === gridAwakening?.type
    )

    if (gridAwakening && awakening) {
      return (
        <section className="Awakening">
          <h5 className={tintElement}>
            {t('modals.characters.subtitles.awakening')}
          </h5>
          <div>
            {gridAwakening.type > 1 ? (
              <img
                alt={awakening.name[locale]}
                src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/awakening/character_${gridAwakening.type}.jpg`}
              />
            ) : (
              ''
            )}
            <span>
              <strong>{`${awakening.name[locale]}`}</strong>&nbsp;
              {`Lv${gridAwakening.level}`}
            </span>
          </div>
        </section>
      )
    }
  }

  return (
    <Hovercard openDelay={350}>
      <HovercardTrigger asChild onClick={props.onTriggerClick}>
        {props.children}
      </HovercardTrigger>
      <HovercardContent className="Character">
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
        {awakeningSection()}
        {overMasterySection()}
        {aetherialMasterySection()}
        {permanentMasterySection()}
        <section className="Footer">
          <a className={`Button ${tintElement}`} href={wikiUrl} target="_new">
            {t('buttons.wiki')}
          </a>
        </section>
      </HovercardContent>
    </Hovercard>
  )
}

export default CharacterHovercard
