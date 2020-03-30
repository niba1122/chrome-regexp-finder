export default interface SearchCondition {
  query: string
  flags: string
}

export function searchConditionsAreEqual(a: SearchCondition, b: SearchCondition) {
  return a.query === b.query && a.flags === b.flags
}
