import React from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import * as HoverCard from '@radix-ui/react-hover-card'

import WeaponLabelIcon from '~components/WeaponLabelIcon'
import UncapIndicator from '~components/UncapIndicator'

import { axData } from '~utils/axData'

import './index.scss'

interface Props {
  gridWeapon: GridWeapon
  children: React.ReactNode
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
    props.gridWeapon.object.element == 0 && props.gridWeapon.element
      ? Element[props.gridWeapon.element]
      : Element[props.gridWeapon.object.element]
  const wikiUrl = `https://gbf.wiki/${props.gridWeapon.object.name.en.replaceAll(
    ' ',
    '_'
  )}`

  const hovercardSide = () => {
    if (props.gridWeapon.position == -1) return 'right'
    else if ([6, 7, 8, 9, 10, 11].includes(props.gridWeapon.position))
      return 'top'
    else return 'bottom'
  }

  const createPrimaryAxSkillString = () => {
    const primaryAxSkills = axData[props.gridWeapon.object.ax - 1]

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
    const primaryAxSkills = axData[props.gridWeapon.object.ax - 1]

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

  function weaponImage() {
    const weapon = props.gridWeapon.object

    if (props.gridWeapon.object.element == 0 && props.gridWeapon.element)
      return `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}_${props.gridWeapon.element}.jpg`
    else
      return `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}.jpg`
  }

  const keysSection = (
    <section className="weaponKeys">
      {WeaponKeyNames[props.gridWeapon.object.series] ? (
        <h5 className={tintElement}>
          {WeaponKeyNames[props.gridWeapon.object.series][locale]}
          {locale === 'en' ? 's' : ''}
        </h5>
      ) : (
        ''
      )}

      {props.gridWeapon.weapon_keys
        ? Array.from(Array(props.gridWeapon.weapon_keys.length)).map((x, i) => {
            return (
              <div
                className="weaponKey"
                key={props.gridWeapon.weapon_keys![i].id}
              >
                <span>{props.gridWeapon.weapon_keys![i].name[locale]}</span>
              </div>
            )
          })
        : ''}
    </section>
  )

  const axSection = (
    <section className="axSkills">
      <h5 className={tintElement}>{t('modals.weapon.subtitles.ax_skills')}</h5>
      <div className="skills">
        <div className="primary axSkill">
          <img
            alt="AX1"
            src={`/icons/ax/primary_${
              props.gridWeapon.ax ? props.gridWeapon.ax[0].modifier : ''
            }.png`}
          />
          <span>{createPrimaryAxSkillString()}</span>
        </div>

        {props.gridWeapon.ax &&
        props.gridWeapon.ax[1].modifier &&
        props.gridWeapon.ax[1].strength ? (
          <div className="secondary axSkill">
            <img
              alt="AX2"
              src={`/icons/ax/secondary_${
                props.gridWeapon.ax ? props.gridWeapon.ax[1].modifier : ''
              }.png`}
            />
            <span>{createSecondaryAxSkillString()}</span>
          </div>
        ) : (
          ''
        )}
      </div>
    </section>
  )

  return (
    <HoverCard.Root className="Hovercard">
      <HoverCard.Trigger>{props.children}</HoverCard.Trigger>
      <HoverCard.Content className="Weapon HovercardContent" side={hovercardSide()}>
        <div className="top">
          <div className="title">
            <h4>{props.gridWeapon.object.name[locale]}</h4>
            <img
              alt={props.gridWeapon.object.name[locale]}
              src={weaponImage()}
            />
          </div>
          <div className="subInfo">
            <div className="icons">
              {props.gridWeapon.object.element !== 0 ||
              (props.gridWeapon.object.element === 0 &&
                props.gridWeapon.element != null) ? (
                <WeaponLabelIcon
                  labelType={
                    props.gridWeapon.object.element === 0 &&
                    props.gridWeapon.element !== 0
                      ? Element[props.gridWeapon.element]
                      : Element[props.gridWeapon.object.element]
                  }
                />
              ) : (
                ''
              )}
              <WeaponLabelIcon
                labelType={Proficiency[props.gridWeapon.object.proficiency]}
              />
            </div>
            <UncapIndicator
              type="weapon"
              ulb={props.gridWeapon.object.uncap.ulb || false}
              flb={props.gridWeapon.object.uncap.flb || false}
              special={false}
            />
          </div>
        </div>

        {props.gridWeapon.object.ax > 0 &&
        props.gridWeapon.ax &&
        props.gridWeapon.ax[0].modifier &&
        props.gridWeapon.ax[0].strength
          ? axSection
          : ''}
        {props.gridWeapon.weapon_keys && props.gridWeapon.weapon_keys.length > 0
          ? keysSection
          : ''}
        <a className={`Button ${tintElement}`} href={wikiUrl} target="_new">
          {t('buttons.wiki')}
        </a>
        <HoverCard.Arrow />
      </HoverCard.Content>
    </HoverCard.Root>
  )
}

export default WeaponHovercard
