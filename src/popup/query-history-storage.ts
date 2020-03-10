import SearchCondition from "./search-condition"

export default class SearchConditionHistoryStorage {
  private static STORAGE_KEY = 'query_history'
  private static MAX_COUNT = 10
  constructor(
    private getter: (key: string) => string | null,
    private setter: (key: string, value: string) => void
  ) { }
  set(searchCondition: SearchCondition) {
    const Class = SearchConditionHistoryStorage
    const current: SearchCondition[] = JSON.parse(this.getter(Class.STORAGE_KEY) ?? '[]')
    const updated: SearchCondition[] = distinctSearchConditions([searchCondition, ...current])
      .slice(0, Class.MAX_COUNT)
    this.setter(Class.STORAGE_KEY, JSON.stringify(updated))
  }
  getAll(): SearchCondition[] {
    const Class = SearchConditionHistoryStorage
    return JSON.parse(this.getter(Class.STORAGE_KEY) ?? '[]')
  }
}

function distinctSearchConditions(from: SearchCondition[]): SearchCondition[] {
  return from.map((value) => `${value.query}//${value.flags}`)
    .filter((value, index, self) => self.indexOf(value) === index)
    .map((value) => {
      const [query, flags] = value.split('//')
      return {
        query,
        flags
      }
    })
}
