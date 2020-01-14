interface HighlightGroup {
  getGroupHighlights(): Highlight[]
  clear(): void
}

interface Highlight {
  select(): void
  unselect(): void
}

interface Store {
  setSearchResult(highlightGroups: HighlightGroup[], highlights: Highlight[]): void
  clear(): void
  isCleared(): boolean
  forwardSelectedHighlight(): void
  backwardSelectedHighlight(): void
  getSelectedHighlight(): Highlight
  onClear(listener: Store.ClearListener): void
  onChangeHighlightSelection(listener: Store.ChangeHighlightSelectionListener): void
}

namespace Store {
  export type ClearListener = (highlightGroups: HighlightGroup[]) => void
  export type ChangeHighlightSelectionListener = (args: {
    previousHighlight?: Highlight,
    nextHighlight?: Highlight,
    total: number,
    nextIndex?: number
  }) => void
}

export interface PageSearcher {
  search(query: string): void
  nextResult(): void
  previousResult(): void
  clear(): void
  addChangeHighlightListener(listener: PageSearcher.ChangeHighlightListener): PageSearcher.Unsubscriber
}

namespace PageSearcher {
  export type ChangeHighlightListener = (total: number, current?: number) => void
  export type Unsubscriber = () => void
}


function createHighlightGroup(node: Node, queryRegExp: RegExp): HighlightGroup {
  const highlightColor = '#ffff00'
  const selectedHighlightColor = '#ff8000'

  function htmlElementIsVisible(element: HTMLElement): boolean {
    return !!element.offsetParent && !element.hidden
  }

  function createHighlight(dom: HTMLElement): Highlight {
    function select() {
      dom.style.backgroundColor = selectedHighlightColor

      const offset = -150
      const clientRect = dom.getBoundingClientRect()
      const y = window.pageYOffset + clientRect.top + offset
      scrollTo(0, y)
    }
    function unselect() {
      dom.style.backgroundColor = highlightColor
    }
    return {
      select,
      unselect
    }
  }

  const matchedTextClass = 'ps-matched-text'
  const text = node.nodeValue
  const rawHighlightGroup = text?.replace(queryRegExp, `<span class="${matchedTextClass}" style="background-color: ${highlightColor};">$&</span>`)

  const highlightGroupDOM = document.createElement('span')
  highlightGroupDOM.innerHTML = rawHighlightGroup || ''

  node.parentNode?.replaceChild(highlightGroupDOM, node)

  const groupHighlights = Array.prototype.filter.call(
    highlightGroupDOM.querySelectorAll<HTMLElement>(`span.${matchedTextClass}`),
    htmlElementIsVisible
  ).map((dom: HTMLElement) => createHighlight(dom))

  function getGroupHighlights(): Highlight[] {
    return groupHighlights
  }

  function clear() {
    const newNode = document.createTextNode(highlightGroupDOM.textContent || '')
    highlightGroupDOM.parentNode?.replaceChild(newNode, highlightGroupDOM)
  }

  return {
    getGroupHighlights,
    clear
  }
}

function createStore(): Store {
  let highlightGroups: HighlightGroup[] = []
  let highlights: Highlight[] = []
  let selectedHighlightIndex = 0

  let clearListener: Store.ClearListener | null = null
  let changeHighlightSelectionListener: Store.ChangeHighlightSelectionListener | null = null

  function setSearchResult(hg: HighlightGroup[], h: Highlight[]) {
    highlightGroups = hg
    highlights = h
    selectedHighlightIndex = 0
    if (changeHighlightSelectionListener) {
      changeHighlightSelectionListener({
        nextHighlight: highlights[selectedHighlightIndex],
        total: highlights.length,
        nextIndex: highlights.length > 0 ? selectedHighlightIndex : undefined
      })
    }
  }

  function clear() {
    if (clearListener) {
      clearListener(highlightGroups)
    }
    const previousHighlight = highlights[selectedHighlightIndex]
    highlightGroups = []
    highlights = []
    selectedHighlightIndex = 0
    if (changeHighlightSelectionListener) {
      changeHighlightSelectionListener({
        previousHighlight: previousHighlight,
        total: highlights.length,
      })
    }
  }

  function isCleared(): boolean {
    return highlightGroups.length === 0 && highlights.length === 0 && selectedHighlightIndex === 0
  }

  function forwardSelectedHighlight() {
    if (!highlights.length) { return }
    const previousHighlight = highlights[selectedHighlightIndex]
    selectedHighlightIndex++
    if (highlights.length === selectedHighlightIndex) {
      selectedHighlightIndex = 0
    }
    if (changeHighlightSelectionListener) {
      changeHighlightSelectionListener({
        previousHighlight: previousHighlight,
        nextHighlight: highlights[selectedHighlightIndex],
        total: highlights.length,
        nextIndex: selectedHighlightIndex
      })
    }
  }

  function backwardSelectedHighlight() {
    if (!highlights.length) { return }
    const previousHighlight = highlights[selectedHighlightIndex]
    if (selectedHighlightIndex === 0) {
      selectedHighlightIndex = highlights.length
    }
    selectedHighlightIndex--
    if (changeHighlightSelectionListener) {
      changeHighlightSelectionListener({
        previousHighlight: previousHighlight,
        nextHighlight: highlights[selectedHighlightIndex],
        total: highlights.length,
        nextIndex: selectedHighlightIndex
      })
    }
  }

  function getSelectedHighlight(): Highlight {
    return highlights[selectedHighlightIndex]
  }

  function onClear(listener: Store.ClearListener) {
    clearListener = listener
  }

  function onChangeHighlightSelection(listener: Store.ChangeHighlightSelectionListener) {
    changeHighlightSelectionListener = listener
  }

  return {
    setSearchResult,
    clear,
    isCleared,
    forwardSelectedHighlight,
    backwardSelectedHighlight,
    getSelectedHighlight,
    onClear,
    onChangeHighlightSelection
  }
}

export function createPageSearcher(rootDOM: Node): PageSearcher {
  let changeHighlightListener: PageSearcher.ChangeHighlightListener | null = null
  const store = createStore()

  store.onClear((highlightGroups) => {
    highlightGroups.forEach((hg) => {
      hg.clear()
    })
  })

  store.onChangeHighlightSelection(({
    previousHighlight,
    nextHighlight,
    total,
    nextIndex
  }) => {
    if (previousHighlight) {
      previousHighlight.unselect()
    }
    if (nextHighlight) {
      nextHighlight.select()
    }

    if (changeHighlightListener) {
      changeHighlightListener(total, nextIndex)
    }
  })

  function _searchRecursively(dom: Node, query: RegExp): Node[] {
    let matchedNodes: Node[] = []
    dom.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.nodeValue && node.nodeValue.match(query)) {
          matchedNodes.push(node)
        }
      } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SCRIPT') {
        matchedNodes = matchedNodes.concat(_searchRecursively(node, query))
      }
    })
    return matchedNodes
  }

  function search(query: string) {
    if (query === '') {
      store.clear()
      return
    }
    if (!store.isCleared()) {
      store.clear()
    }

    const queryRegExp = new RegExp(query, 'gi')
    const matchedTextNodes = _searchRecursively(rootDOM, queryRegExp)

    let highlightGroups: HighlightGroup[] = []
    let highlights: Highlight[] = []
    matchedTextNodes.forEach((node) => {
      const highlightGroup = createHighlightGroup(node, queryRegExp)
      highlightGroups.push(highlightGroup)
      const groupHighlights = highlightGroup.getGroupHighlights()

      highlights = [...highlights, ...groupHighlights]
    })

    store.setSearchResult(highlightGroups, highlights);
  }

  function nextResult() {
    store.forwardSelectedHighlight()
  }

  function previousResult() {
    store.backwardSelectedHighlight()
  }

  function clear() {
    store.clear()
  }

  function addChangeHighlightListener(listener: PageSearcher.ChangeHighlightListener) {
    changeHighlightListener = listener
    return () => {
      changeHighlightListener = null
    }
  }

  return {
    search,
    nextResult,
    previousResult,
    clear,
    addChangeHighlightListener
  }
}
