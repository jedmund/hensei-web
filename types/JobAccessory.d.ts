interface JobAccessory {
  id: string
  granblueId: string
  job: Job
  name: {
    [key: string]: string
    en: string
    ja: string
  }
  rarity: number
}
