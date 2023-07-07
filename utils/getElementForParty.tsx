import { ElementMap } from './elements'

export default function getElementForParty(party: Party) {
  const mainhand = party.grid.weapons.mainWeapon
  if (mainhand && mainhand.object.element === ElementMap.null) {
    return mainhand.element
  } else {
    return mainhand?.object.element
  }
}
