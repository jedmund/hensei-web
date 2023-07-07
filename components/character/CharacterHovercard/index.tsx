import React from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import Button from '~components/common/Button'
import {
  Hovercard,
  HovercardContent,
  HovercardTrigger,
} from '~components/common/Hovercard'
import HovercardHeader from '~components/HovercardHeader'

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

  const tintElement = props.gridCharacter.object.element.slug

  function goTo() {
    const urlSafeName = props.gridCharacter.object.name.en.replaceAll(' ', '_')
    const url = `https://gbf.wiki/${urlSafeName}`

    window.open(url, '_blank')
  }

  function masteryElement(dictionary: ItemSkill[], mastery: ExtendedMastery) {
    const canonicalMastery = dictionary.find(
      (item) => item.id === mastery.modifier
    )

    if (canonicalMastery) {
      return (
        <li className={styles.extendedMastery} key={canonicalMastery.id}>
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
    if (props.gridCharacter && props.gridCharacter.mastery.overMastery) {
      return (
        <section className={styles.mastery}>
          <h5 className={tintElement}>
            {t('modals.characters.subtitles.ring')}
          </h5>
          <ul>
            {[...Array(4)].map((e, i) => {
              const ringIndex = i + 1
              const ringStat: ExtendedMastery =
                props.gridCharacter.mastery.overMastery[i]
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
      props.gridCharacter.mastery.aetherialMastery &&
      props.gridCharacter.mastery.aetherialMastery.modifier > 0
    ) {
      return (
        <section className={styles.mastery}>
          <h5 className={tintElement}>
            {t('modals.characters.subtitles.earring')}
          </h5>
          <ul>
            {masteryElement(
              aetherialMastery,
              props.gridCharacter.mastery.aetherialMastery
            )}
          </ul>
        </section>
      )
    }
  }

  const permanentMasterySection = () => {
    if (props.gridCharacter && props.gridCharacter.mastery.perpetuity) {
      return (
        <section className={styles.mastery}>
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
    const gridAwakening = props.gridCharacter.mastery.awakening

    if (gridAwakening) {
      return (
        <section className={styles.awakening}>
          <h5 className={tintElement}>
            {t('modals.characters.subtitles.awakening')}
          </h5>
          <div>
            {gridAwakening.type.slug !== 'character-balanced' && (
              <img
                alt={gridAwakening.type.name[locale]}
                src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/awakening/${gridAwakening.type.slug}.jpg`}
              />
            )}
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
      bound={true}
    />
  )

  return (
    <Hovercard openDelay={350}>
      <HovercardTrigger asChild onClick={props.onTriggerClick}>
        {props.children}
      </HovercardTrigger>
      <HovercardContent className={styles.content} side="top">
        <HovercardHeader
          gridObject={props.gridCharacter}
          object={props.gridCharacter.object}
          type="character"
        />
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
