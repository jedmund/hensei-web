import React from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import {
  Hovercard,
  HovercardContent,
  HovercardTrigger,
} from '~components/common/Hovercard'
import HovercardHeader from '~components/HovercardHeader'
import Button from '~components/common/Button'

import ax from '~data/ax'
import { ElementMap } from '~utils/elements'

import styles from './index.module.scss'

interface Props {
  gridWeapon: GridWeapon
  children: React.ReactNode
  onTriggerClick: () => void
}

interface KeyNames {
  [key: string]: {
    [key: string]: string
    en: string
    ja: string
  }
}

const WeaponHovercard = (props: Props) => {
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  const { t } = useTranslation('common')

  const WeaponKeyNames: KeyNames = {
    '2': {
      en: 'Pendulum',
      ja: 'ペンデュラム',
    },
    '3': {
      en: 'Teluma',
      ja: 'テルマ',
    },
    '17': {
      en: 'Gauph Key',
      ja: 'ガフスキー',
    },
    '22': {
      en: 'Emblem',
      ja: 'エンブレム',
    },
  }

  const tintElement =
    props.gridWeapon.object.element === ElementMap.null &&
    props.gridWeapon.element
      ? props.gridWeapon.element.slug
      : props.gridWeapon.object.element.slug

  function goTo() {
    const urlSafeName = props.gridWeapon.object.name.en.replaceAll(' ', '_')
    const url = `https://gbf.wiki/${urlSafeName}`

    window.open(url, '_blank')
  }

  const hovercardSide = () => {
    if (props.gridWeapon.position == -1) return 'right'
    else if ([6, 7, 8, 9, 10, 11].includes(props.gridWeapon.position))
      return 'top'
    else return 'bottom'
  }

  const createPrimaryAxSkillString = () => {
    const primaryAxSkills = ax[props.gridWeapon.object.axType - 1]

    if (props.gridWeapon.ax) {
      const simpleAxSkill = props.gridWeapon.ax[0]
      const axSkill = primaryAxSkills.find(
        (skill) => skill.id == simpleAxSkill.modifier
      )

      return `${axSkill?.name[locale]} +${simpleAxSkill.strength}${
        axSkill?.suffix ? axSkill.suffix : ''
      }`
    }

    return ''
  }

  const createSecondaryAxSkillString = () => {
    const primaryAxSkills = ax[props.gridWeapon.object.axType - 1]

    if (props.gridWeapon.ax) {
      const primarySimpleAxSkill = props.gridWeapon.ax[0]
      const secondarySimpleAxSkill = props.gridWeapon.ax[1]

      const primaryAxSkill = primaryAxSkills.find(
        (skill) => skill.id == primarySimpleAxSkill.modifier
      )

      if (primaryAxSkill && primaryAxSkill.secondary) {
        const secondaryAxSkill = primaryAxSkill.secondary.find(
          (skill) => skill.id == secondarySimpleAxSkill.modifier
        )
        return `${secondaryAxSkill?.name[locale]} +${
          secondarySimpleAxSkill.strength
        }${secondaryAxSkill?.suffix ? secondaryAxSkill.suffix : ''}`
      }
    }

    return ''
  }

  const awakeningSection = (
    <section className={styles.awakening}>
      <h5 className={tintElement}>{t('modals.weapon.subtitles.awakening')}</h5>
      <div className={styles.skill}>
        <img
          alt={props.gridWeapon.awakening?.type.name[locale]}
          src={`${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/awakening/${props.gridWeapon.awakening?.type.slug}.png`}
        />
        <span>
          <strong>{`${props.gridWeapon.awakening?.type.name[locale]}`}</strong>
          &nbsp;
          {`Lv${props.gridWeapon.awakening?.level}`}
        </span>
      </div>
    </section>
  )

  const keysSection = (
    <section className={styles.weaponKeys}>
      {WeaponKeyNames[props.gridWeapon.object.series] && (
        <h5 className={tintElement}>
          {WeaponKeyNames[props.gridWeapon.object.series][locale]}
          {locale === 'en' ? 's' : ''}
        </h5>
      )}

      {props.gridWeapon.weaponKeys &&
        Array.from(Array(props.gridWeapon.weaponKeys?.length)).map((x, i) => {
          return (
            <div
              className={styles.weaponKey}
              key={props.gridWeapon.weaponKeys![i].id}
            >
              <span>{props.gridWeapon.weaponKeys![i].name[locale]}</span>
            </div>
          )
        })}
    </section>
  )

  const axSection = (
    <section className={styles.axSkills}>
      <h5 className={tintElement}>{t('modals.weapon.subtitles.ax_skills')}</h5>
      <div className={styles.skills}>
        <div
          className={classNames({
            [styles.axSkill]: true,
            [styles.skill]: true,
          })}
        >
          <div className={styles.axImageWrapper}>
            <img
              alt="AX1"
              src={`/icons/ax/primary_${
                props.gridWeapon.ax ? props.gridWeapon.ax[0].modifier : ''
              }.png`}
            />
          </div>
          <span>{createPrimaryAxSkillString()}</span>
        </div>

        {props.gridWeapon.ax &&
          props.gridWeapon.ax[1].modifier &&
          props.gridWeapon.ax[1].strength && (
            <div
              className={classNames({
                [styles.secondary]: true,
                [styles.axSkill]: true,
                [styles.skill]: true,
              })}
            >
              <div className={styles.axImageWrapper}>
                <img
                  alt="AX2"
                  src={`/icons/ax/secondary_${
                    props.gridWeapon.ax ? props.gridWeapon.ax[1].modifier : ''
                  }.png`}
                />
              </div>
              <span>{createSecondaryAxSkillString()}</span>
            </div>
          )}
      </div>
    </section>
  )

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
      <HovercardContent className={styles.content} side={hovercardSide()}>
        <HovercardHeader
          gridObject={props.gridWeapon}
          object={props.gridWeapon.object}
          type="weapon"
        />
        {props.gridWeapon.object.ax &&
          props.gridWeapon.ax &&
          props.gridWeapon.ax[0].modifier !== undefined &&
          props.gridWeapon.ax[0].strength !== undefined &&
          axSection}
        {props.gridWeapon.awakening && awakeningSection}
        {props.gridWeapon.weaponKeys &&
          props.gridWeapon.weaponKeys.length > 0 &&
          keysSection}
        {wikiButton}
      </HovercardContent>
    </Hovercard>
  )
}

export default WeaponHovercard
