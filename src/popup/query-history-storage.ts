export default class QueryHistoryStorage {
  private static STORAGE_KEY = 'query_history'
  private static SEPARATOR = '//' // `//` cannot exist in a regular expression
  private static MAX_COUNT = 10
  constructor(
    private getter: (key: string) => string | null,
    private setter: (key: string, value: string) => void
  ) { }
  set(query: string) {
    const Class = QueryHistoryStorage
    const current = this.getter(Class.STORAGE_KEY)?.split(Class.SEPARATOR) ?? []
    const updated = [query, ...current]
      .filter((value, index, self) => self.indexOf(value) === index)
      .slice(0, Class.MAX_COUNT)
    this.setter(Class.STORAGE_KEY, updated.join(Class.SEPARATOR))
  }
  getAll(): string[] {
    const Class = QueryHistoryStorage
    return this.getter(Class.STORAGE_KEY)?.split(Class.SEPARATOR) ?? []
  }
}
