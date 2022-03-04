interface AxSkill {
    name: {
        en: string,
        jp: string
    },
    id: number,
    minValue: number,
    maxValue: number,
    suffix?: string,
    secondary?: AxSkill[]
}