export default interface SearchCondition {
  query: string
  flags: string
}

export function searchConditionsAreEqual(a: SearchCondition, b: SearchCondition) {
  return a.query === b.query && a.flags === b.flags
}

export function isSearchCondition(x: any): x is SearchCondition {
  return typeof x.query === 'string' && typeof x.flags === 'string'
}
