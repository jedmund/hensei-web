interface WeaponKey {
  id: string
  name: {
    [key: string]: string
    en: string
    ja: string
  }
  series: integer
  slot: integer
  group: integer
  order: integer
}
