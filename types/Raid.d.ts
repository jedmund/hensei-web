interface Raid {
    id: string
    name: { 
        [key: string]: string
        en: string
        ja: string
    }
    level: number
    group: number
    element: TeamElement
}