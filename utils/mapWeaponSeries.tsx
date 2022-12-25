import { weaponSeries } from '~utils/weaponSeries'

export default (id: number) =>
  weaponSeries.find((series) => series.id === id)?.slug
