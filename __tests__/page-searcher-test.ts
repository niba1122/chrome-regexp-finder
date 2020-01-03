import { createPageSearcher, PageSearcher } from "../src/core/page-searcher";

function setupPolyfill() {
  // https://github.com/jsdom/jsdom/issues/1261#issuecomment-362928131
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    get() { return this.parentNode; },
  });

  window.scrollTo = jest.fn()

}

function setupEachTest() {
  const rootDOM = document.createElement('body')
  rootDOM.innerHTML = `
<h1>Test DOMs</h1>
<section>
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
  <p>Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec, commodo eget, consequat quis, neque. Aliquam faucibus, elit ut dictum aliquet, felis nisl adipiscing sapien, sed malesuada diam lacus eget erat. Cras mollis scelerisque nunc. Nullam arcu. Aliquam consequat. Curabitur augue lorem, dapibus quis, laoreet et, pretium ac, nisi. Aenean magna nisl, mollis quis, molestie eu, feugiat in, orci. In hac habitasse platea dictumst.</p>
</section>
`
  const pageSearcher = createPageSearcher(rootDOM)
  return pageSearcher
}

let pageSearcher!: PageSearcher

beforeAll(() => {
  setupPolyfill()
})

beforeEach(() => {
  pageSearcher = setupEachTest()
})

test('search', (done) => {
  pageSearcher.addChangeHighlightListener((total, current) => {
    expect(total).toBe(3)
    expect(current).toBe(0)
    done()
  })
  pageSearcher.search('tempor')
})

test('no matched text', (done) => {
  pageSearcher.addChangeHighlightListener((total, current) => {
    expect(total).toBe(0)
    expect(current).toBe(undefined)
    done()
  })
  pageSearcher.search('asdfasdf')
})

test('forward result', (done) => {
  pageSearcher.search('tempor')
  pageSearcher.addChangeHighlightListener((total, current) => {
    expect(total).toBe(3)
    expect(current).toBe(1)
    done()
  })
  pageSearcher.nextResult()
})

test('forward result back to first', (done) => {
  pageSearcher.search('tempor')
  pageSearcher.nextResult()
  pageSearcher.nextResult()
  pageSearcher.addChangeHighlightListener((total, current) => {
    expect(total).toBe(3)
    expect(current).toBe(0)
    done()
  })
  pageSearcher.nextResult()
})

test('clear result', (done) => {
  pageSearcher.search('tempor')
  pageSearcher.addChangeHighlightListener((total, current) => {
    expect(total).toBe(0)
    expect(current).toBe(undefined)
    done()
  })
  pageSearcher.clear()
})

test('search 2 times', (done) => {
  pageSearcher.search('tempor')
  pageSearcher.addChangeHighlightListener((total, current) => {
    expect(total).toBe(4)
    expect(current).toBe(0)
    done()
  })
  pageSearcher.search('quis')
})

test('clear result if search by empty text', (done) => {
  pageSearcher.search('tempor')
  pageSearcher.addChangeHighlightListener((total, current) => {
    expect(total).toBe(0)
    expect(current).toBe(undefined)
    done()
  })
  pageSearcher.search('')
})
