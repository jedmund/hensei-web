interface Summon {
    id: string
    granblue_id: number
    element: number
    max_level: number
    name: { 
        en: string
        jp: string
    }
    hp: {
        min_hp: number
        max_hp: number
        max_hp_flb: number
        max_hp_ulb: number
    }
    atk: {
        min_atk: number
        max_atk: number
        max_atk_flb: number
        max_atk_ulb: number
    }
    uncap: {
        flb: boolean
        ulb: boolean
    }
    position?: number
}