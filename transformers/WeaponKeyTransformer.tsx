// Transforms API response to Weapon Key object
export function toObject(data: any): WeaponKey {
  return {
    id: data.id,
    granblueId: data.granblue_id,
    name: {
      en: data.name.en,
      ja: data.name.jp,
    },
    slug: data.slug,
    series: data.series,
    slot: data.slot,
    group: data.group,
    order: data.order,
  }
}
