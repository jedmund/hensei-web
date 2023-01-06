import { elements } from '~data/elements'
import { aetherialMastery } from '~data/overMastery'

export default function elementalizeAetherialMastery(
  gridCharacter: GridCharacter
) {
  const elementalized = aetherialMastery.map((modifier) => {
    const element = elements.find(
      (element) => element.id === gridCharacter.object.element
    )
    const oppositeElement = elements.find(
      (element) => element.id === element.opposite_id
    )
    const newModifier = modifier

    if (element && oppositeElement && modifier.name.en.includes('{Element}')) {
      if (modifier.id === 3) {
        newModifier.name.en = newModifier.name.en.replace(
          '{Element}',
          element.name.en
        )
        newModifier.name.ja = newModifier.name.ja.replace(
          '{Element}',
          element.name.ja
        )
      } else if (modifier.id === 4) {
        newModifier.name.en = newModifier.name.en.replace(
          '{Element}',
          oppositeElement.name.en
        )
        newModifier.name.ja = newModifier.name.ja.replace(
          '{Element}',
          oppositeElement.name.ja
        )
      }
    }

    return newModifier
  })

  elementalized.unshift({
    id: 0,
    name: {
      en: 'No aetherial mastery',
      ja: 'エーテリアルプラス',
    },
    slug: 'no-mastery',
    minValue: 0,
    maxValue: 0,
    fractional: false,
  })

  return elementalized
}
