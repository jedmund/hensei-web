import getElementForParty from './getElementForParty'

export default function elementEmoji(party?: Party) {
  const element = party ? getElementForParty(party) : 0

  if (element === 0) return '⚪'
  else if (element === 1) return '🟢'
  else if (element === 2) return '🔴'
  else if (element === 3) return '🔵'
  else if (element === 4) return '🟤'
  else if (element === 5) return '🟣'
  else if (element === 6) return '🟡'
  else return '⚪'
}
