import { createPageSearcher, PageSearcher } from "./";
import { createDOM, createDOMWithScriptTag } from "./fixtures/dom"

function setupPolyfill() {
  // https://github.com/jsdom/jsdom/issues/1261#issuecomment-362928131
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    get() { return this.parentNode; },
  });

  window.scrollTo = jest.fn()

  HTMLElement.prototype.getBoundingClientRect = () => ({
    bottom: 10,
    height: 10,
    left: 10,
    right: 10,
    top: 10,
    width: 10,
    x: 10,
    y: 10,
    toJSON() { }
  })

  Object.defineProperty(HTMLBodyElement.prototype, 'scrollWidth', {
    get() { return 100 }
  })

  Object.defineProperty(HTMLBodyElement.prototype, 'scrollHeight', {
    get() { return 100 }
  })
}

beforeAll(() => {
  setupPolyfill()
})

test('search', (done) => {
  const dom = createDOM()
  const pageSearcher = createPageSearcher(dom)

  expect.assertions(1)
  pageSearcher.addSearchedListener((total) => {
    expect(total).toBe(3)
    done()
  })

  pageSearcher.search('tempor', 'gi')
})

test('search with regexp string', (done) => {
  const dom = createDOM()
  const pageSearcher = createPageSearcher(dom)

  expect.assertions(1)
  pageSearcher.addSearchedListener((total) => {
    expect(total).toBe(51)
    done()
  })

  pageSearcher.search('l\\w+', 'gi')
})

test('no results', (done) => {
  const dom = createDOM()
  const pageSearcher = createPageSearcher(dom)

  expect.assertions(1)
  pageSearcher.addSearchedListener((total) => {
    expect(total).toBe(0)
    done()
  })

  pageSearcher.search('asdfasdf', 'gi')
})

test('forward result', (done) => {
  const dom = createDOM()
  const pageSearcher = createPageSearcher(dom)

  expect.assertions(2)
  pageSearcher.addSearchedListener((total) => {
    expect(total).toBe(3)
  })
  pageSearcher.addChangeHighlightListener((current) => {
    expect(current).toBe(1)
    done()
  })

  pageSearcher.search('tempor', 'gi')
  pageSearcher.nextResult()
})

test('forward result back to first', (done) => {
  const dom = createDOM()
  const pageSearcher = createPageSearcher(dom)

  expect.assertions(2)
  pageSearcher.addSearchedListener((total) => {
    expect(total).toBe(3)
  })
  let count = 0
  pageSearcher.addChangeHighlightListener((current) => {
    count++
    if (count === 3) {
      expect(current).toBe(0)
      done()
    }
  })

  pageSearcher.search('tempor', 'gi')
  pageSearcher.nextResult()
  pageSearcher.nextResult()
  pageSearcher.nextResult()
})

test('backward result', (done) => {
  const dom = createDOM()
  const pageSearcher = createPageSearcher(dom)

  expect.assertions(2)
  pageSearcher.addSearchedListener((total) => {
    expect(total).toBe(3)
  })
  let count = 0
  pageSearcher.addChangeHighlightListener((current) => {
    count++
    if (count === 2) {
      expect(current).toBe(1)
      done()
    }
  })

  pageSearcher.search('tempor', 'gi')
  pageSearcher.previousResult()
  pageSearcher.previousResult()
})

test('backward result back to last', (done) => {
  const dom = createDOM()
  const pageSearcher = createPageSearcher(dom)

  expect.assertions(2)
  pageSearcher.addSearchedListener((total) => {
    expect(total).toBe(3)
  })
  pageSearcher.addChangeHighlightListener((current) => {
    expect(current).toBe(2)
    done()
  })

  pageSearcher.search('tempor', 'gi')
  pageSearcher.previousResult()
})

test('clear result', (done) => {
  const dom = createDOM()
  const pageSearcher = createPageSearcher(dom)

  expect.assertions(2)
  pageSearcher.addSearchedListener((total) => {
    expect(total).toBe(3)
  })
  pageSearcher.addClearListener(() => {
    expect(true).toBe(true)
    done()
  })

  pageSearcher.search('tempor', 'gi')
  pageSearcher.clear()
})

test('search 2 times', (done) => {
  const dom = createDOM()
  const pageSearcher = createPageSearcher(dom)

  expect.assertions(3)
  let searchCount = 0
  pageSearcher.addSearchedListener((total) => {
    searchCount++
    if (searchCount === 1) {
      expect(total).toBe(3)
    } else if (searchCount === 2) {
      expect(total).toBe(4)
      done()
    }
  })
  pageSearcher.addClearListener(() => {
    expect(searchCount).toBe(1)
  })

  pageSearcher.search('tempor', 'gi')
  pageSearcher.search('quis', 'gi')
})

test('another search with regexp string which matched wider', (done) => {
  const dom = createDOM()
  const pageSearcher = createPageSearcher(dom)

  expect.assertions(3)
  let searchCount = 0
  pageSearcher.addSearchedListener((total) => {
    searchCount++
    if (searchCount === 1) {
      expect(total).toBe(51)
    } else if (searchCount === 2) {
      expect(total).toBe(5)
      done()
    }
  })
  pageSearcher.addClearListener(() => {
    expect(searchCount).toBe(1)
  })

  pageSearcher.search('l\\w+', 'gi')
  pageSearcher.search('l\\w+\\.', 'gi')
})

test('clear result if search by empty text', (done) => {
  const dom = createDOM()
  const pageSearcher = createPageSearcher(dom)

  expect.assertions(1)
  pageSearcher.addClearListener(() => {
    expect(true).toBe(true)
    done()
  })

  pageSearcher.search('tempor', 'gi')
  pageSearcher.search('', 'gi')
})

test('search over DOMs', (done) => {
  const dom = createDOM()
  const pageSearcher = createPageSearcher(dom)

  expect.assertions(1)
  pageSearcher.addSearchedListener((total) => {
    expect(total).toBe(2)
    done()
  })

  pageSearcher.search('ipsum\\s\\w+\\ssit\\samet', 'gi')
})

test('search dom including script tags', (done) => {
  const dom = createDOMWithScriptTag()
  const pageSearcher = createPageSearcher(dom)

  expect.assertions(1)
  pageSearcher.addSearchedListener((total) => {
    expect(total).toBe(51)
    done()
  })

  pageSearcher.search('l\\w+', 'gi')
})

test('search with `g` flag', (done) => {
  const dom = createDOM()
  const pageSearcher = createPageSearcher(dom)

  expect.assertions(1)
  pageSearcher.addSearchedListener((total) => {
    expect(total).toBe(3)
    done()
  })

  pageSearcher.search('Nulla', 'g')
})

test('search with invalid flag', (done) => {
  const dom = createDOM()
  const pageSearcher = createPageSearcher(dom)

  expect.assertions(1)
  pageSearcher.addErrorListener((error) => {
    expect(error.type).toBe(PageSearcher.ErrorType.InvalidFlags)
    done()
  })

  pageSearcher.search('Lorem', 'hoge')
})
