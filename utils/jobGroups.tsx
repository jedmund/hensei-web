interface JobGroup {
  slug: string
  name: {
    [key: string]: string
    en: string
    ja: string
  }
}

export const jobGroups: JobGroup[] = [
  {
    slug: '1',
    name: {
      en: 'Row I',
      ja: 'Class I',
    },
  },
  {
    slug: '2',
    name: {
      en: 'Row II',
      ja: 'Class II',
    },
  },
  {
    slug: '3',
    name: {
      en: 'Row III',
      ja: 'Class III',
    },
  },
  {
    slug: '4',
    name: {
      en: 'Row IV',
      ja: 'Class IV',
    },
  },
  {
    slug: '5',
    name: {
      en: 'Row V',
      ja: 'Class V',
    },
  },
  {
    slug: 'ex1',
    name: {
      en: 'Extra I',
      ja: 'EXTRA I',
    },
  },
  {
    slug: 'ex2',
    name: {
      en: 'Extra II',
      ja: 'EXTRA II',
    },
  },
]
