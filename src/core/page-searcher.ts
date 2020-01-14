export interface PageSearcher {
  search: (query: string) => void
  nextResult: () => void
  previousResult: () => void
  clear: () => void
  addChangeHighlightListener: (listener: PageSearcher.ChangeHighlightListener) => PageSearcher.Unsubscriber
}

namespace PageSearcher {
  export type ChangeHighlightListener = (total: number, current?: number) => void
  export type Unsubscriber = () => void
}

interface Store {
  setSearchResult(highlightGroups: HTMLElement[], highlights: HTMLElement[]): void
  clear(): void
  isCleared(): boolean
  forwardSelectedHighlight(): void
  backwardSelectedHighlight(): void
  getSelectedHighlight(): HTMLElement
  onClear(listener: Store.ClearListener): void
  onChangeHighlightSelection(listener: Store.ChangeHighlightSelectionListener): void
}

namespace Store {
  export type ClearListener = (highlightGroups: Node[]) => void
  export type ChangeHighlightSelectionListener = (args: {
    previousHighlight?: HTMLElement,
    nextHighlight?: HTMLElement,
    total: number,
    nextIndex?: number
  }) => void
}

function createStore(): Store {
  let highlightGroups: HTMLElement[] = []
  let highlights: HTMLElement[] = []
  let selectedHighlightIndex = 0

  let clearListener: Store.ClearListener | null = null
  let changeHighlightSelectionListener: Store.ChangeHighlightSelectionListener | null = null

  function setSearchResult(hg: HTMLElement[], h: HTMLElement[]) {
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

  function getSelectedHighlight(): HTMLElement {
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

  store.onClear((highlights) => {
    highlights.forEach((node) => {
      const newNode = document.createTextNode(node.textContent || '')
      node.parentNode?.replaceChild(newNode, node)
    })
  })

  store.onChangeHighlightSelection(({
    previousHighlight,
    nextHighlight,
    total,
    nextIndex
  }) => {
    if (previousHighlight) {
      previousHighlight.style.backgroundColor = '#ffff00'
    }
    if (nextHighlight) {
      nextHighlight.style.backgroundColor = '#ff8000'

      const offset = -150
      const clientRect = nextHighlight.getBoundingClientRect()
      const y = window.pageYOffset + clientRect.top + offset
      scrollTo(0, y)
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

  function htmlElementIsVisible(element: HTMLElement): boolean {
    return !!element.offsetParent && !element.hidden
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

    let highlightGroups: HTMLElement[] = []
    let highlights: HTMLElement[] = []
    const matchedTextClass = 'ps-matched-text'
    matchedTextNodes.forEach((node) => {
      const text = node.nodeValue
      const rawHighlightGroup = text?.replace(queryRegExp, `<span class="${matchedTextClass}" style="background-color: #ffff00;">$&</span>`)

      const highlightGroup = document.createElement('span')
      highlightGroup.innerHTML = rawHighlightGroup || ''

      node.parentNode?.replaceChild(highlightGroup, node)
      highlightGroups.push(highlightGroup)

      const groupHighlights = Array.prototype.filter.call(
        highlightGroup.querySelectorAll<HTMLElement>(`span.${matchedTextClass}`),
        htmlElementIsVisible
      )

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
