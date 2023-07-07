import { elements } from '~utils/elements'
import { aetherialMastery } from '~data/overMastery'

export default function elementalizeAetherialMastery(
  gridCharacter: GridCharacter
) {
  const elementalized = aetherialMastery.map((modifier) => {
    const element = elements.find(
      (a) => a.id === gridCharacter.object.element.id
    )

    const oppositeElement = elements.find((b) => {
      if (element) return b.id === element.opposite_id
    })

    const newModifier = modifier

    if (element && oppositeElement && modifier.name.en.includes('{Element}')) {
      if (modifier.id === 3) {
        newModifier.name.en = newModifier.name.en.replace(
          '{Element}',
          element.name.en
        )
        newModifier.name.ja = newModifier.name.ja.replace(
          '{属性}',
          `${element.name.ja}属性`
        )
      } else if (modifier.id === 4) {
        newModifier.name.en = newModifier.name.en.replace(
          '{Element}',
          oppositeElement.name.en
        )
        newModifier.name.ja = newModifier.name.ja.replace(
          '{属性}',
          `${oppositeElement.name.ja}属性`
        )
      }
    }

    return newModifier
  })

  elementalized.unshift({
    id: 0,
    granblueId: '',
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
