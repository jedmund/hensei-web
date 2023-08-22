import cloneDeep from 'lodash.clonedeep'

export function convertAdvancedFilters(filters: FilterSet) {
  let copy = cloneDeep(filters)

  const includes = filterString(filters.includes || [])
  const excludes = filterString(filters.excludes || [])

  delete copy.includes
  delete copy.excludes

  return {
    ...copy,
    includes,
    excludes,
  }
}

export function filterString(list: MentionItem[]) {
  return list.map((item) => item.granblue_id).join(',')
}
