import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSnapshot } from 'valtio'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'
import 'fix-date'

import { accountState } from '~utils/accountState'
import { formatTimeAgo } from '~utils/timeAgo'

import Button from '~components/common/Button'

import SaveIcon from '~public/icons/Save.svg'
import ShieldIcon from '~public/icons/Shield.svg'
import styles from './index.module.scss'

interface Props {
  party: Party
  loading: boolean
  onClick: (shortcode: string) => void
  onSave?: (partyId: string, favorited: boolean) => void
}

const GridRep = ({ party, loading, onClick, onSave }: Props) => {
  const numWeapons: number = 9
  const numSummons: number = 4

  const { account } = useSnapshot(accountState)

  const router = useRouter()
  const { t } = useTranslation('common')
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  const [visible, setVisible] = useState(false)
  const [currentView, setCurrentView] = useState<
    'characters' | 'weapons' | 'summons'
  >('summons')

  const [mainhand, setMainhand] = useState<Weapon>()
  const [weapons, setWeapons] = useState<GridArray<Weapon>>({})
  const [weaponGrid, setWeaponGrid] = useState<GridArray<GridWeapon>>({})
  const [characters, setCharacters] = useState<GridArray<Character>>({})
  const [characterGrid, setCharacterGrid] = useState<GridArray<GridCharacter>>(
    {}
  )
  const [mainSummon, setMainSummon] = useState<GridSummon>()
  const [summons, setSummons] = useState<GridArray<Summon>>({})
  const [summonGrid, setSummonGrid] = useState<GridArray<GridSummon>>({})

  // Style construction

  const gridRepClasses = classNames({
    [styles.gridRep]: true,
    [styles.visible]: visible,
    [styles.hidden]: !visible,
  })

  const titleClass = classNames({
    empty: !party.name,
  })

  const raidClass = classNames({
    [styles.raid]: true,
    [styles.empty]: !party.raid,
  })

  const userClass = classNames({
    [styles.user]: true,
    [styles.empty]: !party.user,
  })

  const mainhandClasses = classNames({
    [styles.weapon]: true,
    [styles.mainhand]: true,
  })

  const weaponClasses = classNames({
    [styles.weapon]: true,
    [styles.grid]: true,
  })

  const protagonistClasses = classNames({
    [styles.protagonist]: true,
    [styles.grid]: true,
  })

  const characterClasses = classNames({
    [styles.character]: true,
    [styles.grid]: true,
  })

  // Hooks

  useEffect(() => {
    if (loading) {
      setVisible(false)
    } else {
      const timeout = setTimeout(() => {
        setVisible(true)
      }, 150)
      return () => clearTimeout(timeout)
    }
  }, [loading])

  useEffect(() => {
    setVisible(false) // Trigger fade out
    const timeout = setTimeout(() => {
      setVisible(true) // Trigger fade in
    }, 300) // You can adjust the timing based on your preference
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    const newWeapons = Array(numWeapons)
    const gridWeapons = Array(numWeapons)

    let foundMainhand = false
    for (const [key, value] of Object.entries(party.weapons)) {
      if (value.position == -1) {
        setMainhand(value.object)
        foundMainhand = true
      } else if (!value.mainhand && value.position != null) {
        newWeapons[value.position] = value.object
        gridWeapons[value.position] = value
      }
    }

    if (!foundMainhand) {
      setMainhand(undefined)
    }

    setWeapons(newWeapons)
    setWeaponGrid(gridWeapons)
  }, [party])

  useEffect(() => {
    const newCharacters = Array(3)
    const gridCharacters = Array(3)

    if (party.characters) {
      for (const [key, value] of Object.entries(party.characters)) {
        if (value.position != null) {
          newCharacters[value.position] = value.object
          gridCharacters[value.position] = value
        }
      }

      setCharacters(newCharacters)
      setCharacterGrid(gridCharacters)
    }
  }, [party])

  useEffect(() => {
    const newSummons = Array(numSummons)
    const gridSummons = Array(numSummons)

    if (party.summons) {
      let foundMainSummon = false

      for (const [key, value] of Object.entries(party.summons)) {
        if (value.main) {
          setMainSummon(value)
          foundMainSummon = true
        } else if (!value.main && !value.friend && value.position != null) {
          newSummons[value.position] = value.object
          gridSummons[value.position] = value
        }
      }

      setSummons(newSummons)
      setSummonGrid(gridSummons)
    }
  }, [party])

  // Methods: Image generation

  function generateMainhandImage() {
    let url = ''

    if (mainhand) {
      const weapon = Object.values(party.weapons).find(
        (w) => w && w.object.id === mainhand.id
      )

      if (mainhand.element == 0 && weapon && weapon.element) {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${mainhand.granblue_id}_${weapon.element}.jpg`
      } else {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-main/${mainhand.granblue_id}.jpg`
      }
    }

    return mainhand && party.weapons[0] ? (
      <img alt={mainhand.name[locale]} src={url} />
    ) : (
      ''
    )
  }

  function generateWeaponGridImage(position: number) {
    let url = ''

    const weapon = weapons[position]
    const gridWeapon = weaponGrid[position]

    if (weapon && gridWeapon) {
      if (weapon.element == 0 && gridWeapon.element) {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}_${gridWeapon.element}.jpg`
      } else {
        url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/weapon-grid/${weapon.granblue_id}.jpg`
      }
    }

    return weapons[position] ? (
      <img alt={weapons[position]?.name[locale]} src={url} />
    ) : (
      ''
    )
  }

  function generateMCImage() {
    let source = ''

    if (party.job) {
      const slug = party.job.name.en.replaceAll(' ', '-').toLowerCase()
      const gender = party.user?.gender == 1 ? 'b' : 'a'
      source = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/job-portraits/${slug}_${gender}.png`
    }

    return (
      party.job &&
      party.job.id !== '-1' && (
        <img alt={party.job ? party.job?.name[locale] : ''} src={source} />
      )
    )
  }

  function generateCharacterGridImage(position: number) {
    let url = ''

    const gridCharacter = characterGrid[position]
    const character = characters[position]

    if (character && gridCharacter) {
      // Change the image based on the uncap level
      let suffix = '01'
      if (gridCharacter.transcendence_step > 0) suffix = '04'
      else if (gridCharacter.uncap_level >= 5) suffix = '03'
      else if (gridCharacter.uncap_level > 2) suffix = '02'

      if (gridCharacter.object.granblue_id === '3030182000') {
        let element = 1
        if (mainhand && mainhand.element) {
          element = mainhand.element
        }

        suffix = `${suffix}_0${element}`
      }

      const url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/character-main/${character.granblue_id}_${suffix}.jpg`

      return (
        characters[position] && (
          <img alt={characters[position]?.name[locale]} src={url} />
        )
      )
    }
  }

  function generateMainSummonImage() {
    let url = ''

    const upgradedSummons = [
      '2040094000',
      '2040100000',
      '2040080000',
      '2040098000',
      '2040090000',
      '2040084000',
      '2040003000',
      '2040056000',
      '2040020000',
      '2040034000',
      '2040028000',
      '2040027000',
      '2040046000',
      '2040047000',
    ]

    if (mainSummon) {
      // Change the image based on the uncap level
      let suffix = ''
      if (mainSummon.object.uncap.xlb && mainSummon.uncap_level == 6) {
        if (
          mainSummon.transcendence_step >= 1 &&
          mainSummon.transcendence_step < 5
        ) {
          suffix = '_03'
        } else if (mainSummon.transcendence_step === 5) {
          suffix = '_04'
        }
      } else if (
        upgradedSummons.indexOf(mainSummon.object.granblue_id.toString()) !=
          -1 &&
        mainSummon.uncap_level == 5
      ) {
        suffix = '_02'
      }

      url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-main/${mainSummon.object.granblue_id}${suffix}.jpg`
    }

    return mainSummon && <img alt={mainSummon.object.name[locale]} src={url} />
  }

  function generateSummonGridImage(position: number) {
    let url = ''

    const gridSummon = party.summons[position]
    const summon = gridSummon.object

    const upgradedSummons = [
      '2040094000',
      '2040100000',
      '2040080000',
      '2040098000',
      '2040090000',
      '2040084000',
      '2040003000',
      '2040056000',
      '2040020000',
      '2040034000',
      '2040028000',
      '2040027000',
      '2040046000',
      '2040047000',
    ]

    if (summon && gridSummon) {
      // Change the image based on the uncap level
      let suffix = ''
      if (gridSummon.object.uncap.xlb && gridSummon.uncap_level == 6) {
        if (
          gridSummon.transcendence_step >= 1 &&
          gridSummon.transcendence_step < 5
        ) {
          suffix = '_03'
        } else if (gridSummon.transcendence_step === 5) {
          suffix = '_04'
        }
      } else if (
        upgradedSummons.indexOf(summon.granblue_id.toString()) != -1 &&
        gridSummon.uncap_level == 5
      ) {
        suffix = '_02'
      }

      url = `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/summon-grid/${summon.granblue_id}${suffix}.jpg`
    }
    return (
      summons[position] && (
        <img alt={summons[position]?.name[locale]} src={url} />
      )
    )
  }

  function sendSaveData() {
    if (onSave) onSave(party.id, party.favorited)
  }

  const userImage = () => {
    if (party.user && party.user.avatar) {
      return (
        <img
          alt={party.user.avatar.picture}
          className={`profile ${party.user.avatar.element}`}
          srcSet={`/profile/${party.user.avatar.picture}.png,
                              /profile/${party.user.avatar.picture}@2x.png 2x`}
          src={`/profile/${party.user.avatar.picture}.png`}
        />
      )
    } else
      return (
        <img
          alt={t('no_user')}
          className={`profile anonymous`}
          srcSet={`/profile/npc.png,
                            /profile/npc@2x.png 2x`}
          src={`/profile/npc.png`}
        />
      )
  }

  const attribution = () => (
    <span className={userClass}>
      {userImage()}
      {party.user ? party.user.username : t('no_user')}
    </span>
  )

  const renderWeaponGrid = (
    <div className={styles.weaponGrid}>
      <div className={mainhandClasses}>{generateMainhandImage()}</div>

      <ul className={styles.weapons}>
        {Array.from(Array(numWeapons)).map((x, i) => {
          return (
            <li
              key={`${party.shortcode}-weapon-${i}`}
              className={weaponClasses}
            >
              {generateWeaponGridImage(i)}
            </li>
          )
        })}
      </ul>
    </div>
  )

  const renderCharacterGrid = (
    <div className={styles.characterGrid}>
      <div className={protagonistClasses}>{generateMCImage()}</div>
      {Array.from(Array(3)).map((x, i) => {
        return (
          <li
            key={`${party.shortcode}-chara-${i}`}
            className={characterClasses}
          >
            {generateCharacterGridImage(i)}
          </li>
        )
      })}
    </div>
  )

  const renderSummonGrid = (
    <div className={styles.summonGrid}>
      <div className={styles.mainSummon}>{generateMainSummonImage()}</div>
      <ul className={styles.summons}>
        {Array.from(Array(numSummons)).map((x, i) => {
          return (
            <li key={`summons-${i}`} className={styles.summon}>
              {generateSummonGridImage(i)}
            </li>
          )
        })}
      </ul>
    </div>
  )

  const detailsWithUsername = (
    <div className={styles.details}>
      <div className={styles.top}>
        <div className={styles.info}>
          <h2 className={titleClass}>
            {party.name ? party.name : t('no_title')}
          </h2>
          <div className={styles.properties}>
            <span className={raidClass}>
              {party.raid ? party.raid.name[locale] : t('no_raid')}
            </span>
            {party.full_auto && (
              <span className={styles.fullAuto}>
                {` · ${t('party.details.labels.full_auto')}`}
              </span>
            )}
            {party.raid && party.raid.group.extra && (
              <span className={styles.extra}>{` · EX`}</span>
            )}
          </div>
        </div>
        {account.authorized &&
        ((party.user && account.user && account.user.id !== party.user.id) ||
          !party.user) ? (
          <Link href="#">
            <Button
              className={classNames({
                save: true,
                saved: party.favorited,
              })}
              leftAccessoryIcon={<SaveIcon className="stroke" />}
              active={party.favorited}
              bound={true}
              size="small"
              onClick={sendSaveData}
            />
          </Link>
        ) : (
          ''
        )}
      </div>
      <div className={styles.attributed}>
        {attribution()}

        <time
          className={styles.lastUpdated}
          dateTime={new Date(party.created_at).toISOString()}
        >
          {formatTimeAgo(new Date(party.created_at), locale)}
        </time>
      </div>
    </div>
  )

  function changeView(view: 'characters' | 'weapons' | 'summons') {
    setCurrentView(view)
  }

  return (
    <Link href={`/p/${party.shortcode}`} className={gridRepClasses}>
      {detailsWithUsername}
      <div className={styles.gridContainer}>
        {currentView === 'characters'
          ? renderCharacterGrid
          : currentView === 'summons'
          ? renderSummonGrid
          : renderWeaponGrid}
      </div>
      <ul className={styles.indicators}>
        <li
          className={classNames({
            [styles.active]: currentView === 'characters',
          })}
          onMouseEnter={() => changeView('characters')}
          onMouseLeave={() => changeView('weapons')}
        >
          <div className={styles.indicator} />
          <span>Characters</span>
        </li>
        <li
          className={classNames({
            [styles.active]: currentView === 'weapons',
          })}
          onMouseEnter={() => changeView('weapons')}
        >
          <div className={styles.indicator} />
          <span>Weapons</span>
        </li>
        <li
          className={classNames({
            [styles.active]: currentView === 'summons',
          })}
          onMouseEnter={() => changeView('summons')}
          onMouseLeave={() => changeView('weapons')}
        >
          <div className={styles.indicator} />
          <span>Summons</span>
        </li>
      </ul>
    </Link>
  )
}

export default GridRep
