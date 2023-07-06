import { elements } from '../utils/elements'

export function toObject(value: number) {
  return elements.find((element) => element.id === value) || elements[0]
}

export function toParam(value: string) {
  return elements.find((element) => element.name.en === value)
}
