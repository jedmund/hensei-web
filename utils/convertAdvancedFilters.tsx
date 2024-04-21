import cloneDeep from 'lodash.clonedeep'

export function convertAdvancedFilters(filters: FilterSet): ConvertedFilters {
  let copy: FilterSet = cloneDeep(filters)

  const includes: string = filterString(filters.includes || [])
  const excludes: string = filterString(filters.excludes || [])

  delete (copy as any).includes
  delete (copy as any).excludes

  return {
    ...copy,
    includes,
    excludes,
  } as ConvertedFilters
}

export function filterString(list: MentionItem[]): string {
  return list.map((item) => item.granblue_id).join(',')
}
