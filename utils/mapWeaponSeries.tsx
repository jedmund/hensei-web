import { weaponSeries } from '~data/weaponSeries'

export default (id: number) =>
  weaponSeries.find((series) => series.id === id)?.slug
