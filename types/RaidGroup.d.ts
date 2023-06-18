interface RaidGroup {
  id: string
  name: {
    [key: string]: string
    en: string
    ja: string
  }
  raids: Raid[]
  difficulty: number
  section: number
  order: number
  extra: boolean
  guidebooks: boolean
  hl: boolean
}
