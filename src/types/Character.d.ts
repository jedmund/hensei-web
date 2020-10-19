interface Character {
    id: string
    granblue_id: string
    element: number
    rarity: number
    gender: number
    max_level: number
    name: { 
        en: string
        jp: string
    }
    hp: {
        min_hp: number
        max_hp: number
        max_hp_flb: number
    }
    atk: {
        min_atk: number
        max_atk: number
        max_atk_flb: number
    }
    uncap: {
        flb: boolean
    }
    race: {
        race1: number
        race2: number
    }
    proficiency: {
        proficiency1: number
        proficiency2: number
    }
    position?: number
}