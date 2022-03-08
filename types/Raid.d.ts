interface Raid {
    id: string
    name: { 
        [key: string]: string
        en: string
        ja: string
    }
    slug: string
    level: number
    group: number
    element: number
}