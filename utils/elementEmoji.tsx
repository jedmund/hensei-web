import { ElementMap } from './elements'
import getElementForParty from './getElementForParty'

export default function elementEmoji(party?: Party) {
  const element = party ? getElementForParty(party) : ElementMap.null

  if (element === ElementMap.null) return '⚪'
  else if (element === ElementMap.wind) return '🟢'
  else if (element === ElementMap.fire) return '🔴'
  else if (element === ElementMap.water) return '🔵'
  else if (element === ElementMap.earth) return '🟤'
  else if (element === ElementMap.dark) return '🟣'
  else if (element === ElementMap.light) return '🟡'
  else return '⚪'
}
