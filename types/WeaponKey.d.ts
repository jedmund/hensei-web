interface WeaponKey {
  id: string
  granblueId: string
  name: {
    [key: string]: string
    en: string
    ja: string
  }
  slug: string
  series: integer
  slot: integer
  group: integer
  order: integer
}
