import { elements, allElement } from '~data/elements'

export function parseElement(query: string) {
  let element: TeamElement | undefined =
    query === 'all'
      ? allElement
      : elements.find((element) => element.name.en.toLowerCase() === query)
  return element ? element.id : -1
}

export function serializeElement(value: number | undefined) {
  let name = ''

  if (value != undefined) {
    if (value == -1) name = allElement.name.en.toLowerCase()
    else name = elements[value].name.en.toLowerCase()
  }

  return name
}
