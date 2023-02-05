interface WeaponKeyGroup {
  id: number
  slug: string
  name: {
    [key: string]: string
    en: string
    ja: string
  }
}

export const weaponKeyGroups: WeaponKeyGroup[] = [
  {
    id: 0,
    slug: 'pendulum',
    name: {
      en: 'Pendulum',
      ja: 'ペンデュラム',
    },
  },
  {
    id: 1,
    slug: 'chain',
    name: {
      en: 'Chain',
      ja: 'チェイン',
    },
  },
  {
    id: 2,
    slug: 'teluma',
    name: {
      en: 'Teluma',
      ja: 'テルマ',
    },
  },
  {
    id: 3,
    slug: 'gauph',
    name: {
      en: 'Gauph Key',
      ja: 'ガフスキー',
    },
  },
  {
    id: 4,
    slug: 'emblem',
    name: {
      en: 'Emblem',
      ja: 'エンブレム',
    },
  },
]
