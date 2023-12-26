interface WeaponKey {
  id: string
  granblue_id: string
  name: {
    [key: string]: string
    en: string
    ja: string
  }
  slug: string
  series: integer[]
  slot: integer
  group: integer
  order: integer
}
