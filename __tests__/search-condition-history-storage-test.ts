import SearchConditionHistoryStorage from "../src/popup/search-condition-history-storage"

class MockStorage {
  data: { [key: string]: string } = {}
  get(key: string): string | null {
    return this.data[key] ?? null
  }
  set(key: string, value: string) {
    this.data[key] = value
  }
}

test('set and getAll', () => {
  const storage = new MockStorage()
  const searchConditionHistoryStorage = new SearchConditionHistoryStorage(
    (key) => storage.get(key),
    (key, value) => storage.set(key, value)
  )

  searchConditionHistoryStorage.set({
    query: 'hoge',
    flags: 'gi'
  })

  const history = searchConditionHistoryStorage.getAll()
  expect(history).toEqual([{
    query: 'hoge',
    flags: 'gi'
  }])
})

test('set different values', () => {
  const storage = new MockStorage()
  const searchConditionHistoryStorage = new SearchConditionHistoryStorage(
    (key) => storage.get(key),
    (key, value) => storage.set(key, value)
  )

  searchConditionHistoryStorage.set({
    query: 'hoge',
    flags: 'gi'
  })

  searchConditionHistoryStorage.set({
    query: 'fuga',
    flags: 'g'
  })

  const history = searchConditionHistoryStorage.getAll()
  expect(history).toEqual([
    {
      query: 'fuga',
      flags: 'g'
    },
    {
      query: 'hoge',
      flags: 'gi'
    }
  ])
})

test('set same values', () => {
  const storage = new MockStorage()
  const searchConditionHistoryStorage = new SearchConditionHistoryStorage(
    (key) => storage.get(key),
    (key, value) => storage.set(key, value)
  )

  searchConditionHistoryStorage.set({
    query: 'hoge',
    flags: 'gi'
  })

  searchConditionHistoryStorage.set({
    query: 'hoge',
    flags: 'gi'
  })

  const history = searchConditionHistoryStorage.getAll()
  expect(history).toEqual([
    {
      query: 'hoge',
      flags: 'gi'
    }
  ])
})

test('set values which has different queries', () => {
  const storage = new MockStorage()
  const searchConditionHistoryStorage = new SearchConditionHistoryStorage(
    (key) => storage.get(key),
    (key, value) => storage.set(key, value)
  )

  searchConditionHistoryStorage.set({
    query: 'hoge',
    flags: 'gi'
  })

  searchConditionHistoryStorage.set({
    query: 'fuga',
    flags: 'gi'
  })

  const history = searchConditionHistoryStorage.getAll()
  expect(history).toEqual([
    {
      query: 'fuga',
      flags: 'gi'
    },
    {
      query: 'hoge',
      flags: 'gi'
    }
  ])
})

test('set values which has different flags', () => {
  const storage = new MockStorage()
  const searchConditionHistoryStorage = new SearchConditionHistoryStorage(
    (key) => storage.get(key),
    (key, value) => storage.set(key, value)
  )

  searchConditionHistoryStorage.set({
    query: 'hoge',
    flags: 'gi'
  })

  searchConditionHistoryStorage.set({
    query: 'hoge',
    flags: 'g'
  })

  const history = searchConditionHistoryStorage.getAll()
  expect(history).toEqual([
    {
      query: 'hoge',
      flags: 'g'
    },
    {
      query: 'hoge',
      flags: 'gi'
    }
  ])
})
