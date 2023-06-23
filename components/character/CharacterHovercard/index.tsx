import React from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import {
  Hovercard,
  HovercardContent,
  HovercardTrigger,
} from '~components/common/Hovercard'
import Button from '~components/common/Button'
import WeaponLabelIcon from '~components/weapon/WeaponLabelIcon'
import UncapIndicator from '~components/uncap/UncapIndicator'

import {
  overMastery,
  aetherialMastery,
  permanentMastery,
} from '~data/overMastery'
import { ExtendedMastery } from '~types'

import styles from './index.module.scss'

interface Props {
  gridCharacter: GridCharacter
  children: React.ReactNode
  onTriggerClick: () => void
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

  function goTo() {
    const urlSafeName = props.gridCharacter.object.name.en.replaceAll(' ', '_')
    const url = `https://gbf.wiki/${urlSafeName}`

    window.open(url, '_blank')
  }

  const perpetuity = () => {
    if (props.gridCharacter && props.gridCharacter.perpetuity) {
      return <i className="Perpetuity" />
    }
  }

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
        <li className="ExtendedMastery" key={canonicalMastery.id}>
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

    if (gridAwakening) {
      return (
        <section className="Awakening">
          <h5 className={tintElement}>
            {t('modals.characters.subtitles.awakening')}
          </h5>
          <div>
            <img
              alt={gridAwakening.type.name[locale]}
              src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/awakening/${gridAwakening.type.slug}.jpg`}
            />
            <span>
              <strong>{`${gridAwakening.type.name[locale]}`}</strong>&nbsp;
              {`Lv${gridAwakening.level}`}
            </span>
          </div>
        </section>
      )
    }
  }

  const wikiButton = (
    <Button
      className={tintElement}
      text={t('buttons.wiki')}
      onClick={goTo}
      contained={true}
    />
  )

  return (
    <Hovercard openDelay={350}>
      <HovercardTrigger asChild onClick={props.onTriggerClick}>
        {props.children}
      </HovercardTrigger>
      <HovercardContent className="Character" side="top">
        <div className="top">
          <div className="title">
            <h4>{props.gridCharacter.object.name[locale]}</h4>
            <div className="Image">
              {perpetuity()}
              <img
                alt={props.gridCharacter.object.name[locale]}
                src={characterImage()}
              />
            </div>
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
              transcendenceStage={props.gridCharacter.transcendence_step}
              special={props.gridCharacter.object.special}
            />
          </div>
        </div>
        {wikiButton}
        {awakeningSection()}
        {overMasterySection()}
        {aetherialMasterySection()}
        {permanentMasterySection()}
      </HovercardContent>
    </Hovercard>
  )
}

export default CharacterHovercard
