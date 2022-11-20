import React, { useEffect, useState } from "react"
import { setCookie } from "cookies-next"
import Router, { useRouter } from "next/router"
import { useTranslation } from "react-i18next"
import { AxiosResponse } from "axios"

import * as Dialog from "@radix-ui/react-dialog"

import api from "~utils/api"
import { appState } from "~utils/appState"
import { accountState } from "~utils/accountState"

import Button from "~components/Button"

import "./index.scss"

interface Props {
  open: boolean
  incomingCharacter?: Character
  conflictingCharacters?: GridCharacter[]
  desiredPosition: number
  resolveConflict: () => void
  resetConflict: () => void
}

const CharacterConflictModal = (props: Props) => {
  const { t } = useTranslation("common")

  // States
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(props.open)
  }, [setOpen, props.open])

  function imageUrl(character?: Character, uncap: number = 0) {
    // Change the image based on the uncap level
    let suffix = "01"
    if (uncap == 6) suffix = "04"
    else if (uncap == 5) suffix = "03"
    else if (uncap > 2) suffix = "02"

    console.log(appState.grid.weapons.mainWeapon)
    // Special casing for Lyria (and Young Cat eventually)
    if (character?.granblue_id === "3030182000") {
      let element = 1
      if (
        appState.grid.weapons.mainWeapon &&
        appState.grid.weapons.mainWeapon.element
      ) {
        element = appState.grid.weapons.mainWeapon.element
      } else if (appState.party.element != 0) {
        element = appState.party.element
      }

      suffix = `${suffix}_0${element}`
    }

    return `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/chara-square/${character?.granblue_id}_${suffix}.jpg`
  }

  function openChange(open: boolean) {
    setOpen(open)
  }

  function close() {
    setOpen(false)
    props.resetConflict()
  }

  return (
    <Dialog.Root open={open} onOpenChange={openChange}>
      <Dialog.Portal>
        <Dialog.Content
          className="Conflict Dialog"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <p>
            Only one version of a character can be included in each party. Do
            you want to change your party members?
          </p>
          <div className="diagram">
            <ul>
              {props.conflictingCharacters?.map((character, i) => (
                <li className="character" key={`conflict-${i}`}>
                  <img
                    alt={character.object.name.en}
                    src={imageUrl(character.object, character.uncap_level)}
                  />
                  <span>{character.object.name.en}</span>
                </li>
              ))}
            </ul>
            <span className="arrow">&rarr;</span>
            <div className="character">
              <img
                alt={props.incomingCharacter?.name.en}
                src={imageUrl(props.incomingCharacter)}
              />
              {props.incomingCharacter?.name.en}
            </div>
          </div>
          <footer>
            <Button onClick={close}>Nevermind</Button>
            <Button onClick={props.resolveConflict}>Confirm</Button>
          </footer>
        </Dialog.Content>
        <Dialog.Overlay className="Overlay" />
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default CharacterConflictModal
