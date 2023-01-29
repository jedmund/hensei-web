export default function getElementForParty(party: Party) {
  const mainhand = party.weapons.find((weapon) => weapon.mainhand)
  if (mainhand && mainhand.object.element === 0) {
    return mainhand.element
  } else {
    return mainhand?.object.element
  }
}
