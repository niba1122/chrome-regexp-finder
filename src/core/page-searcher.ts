interface PageSearcher {
  search: (query: string) => void
  nextResult: () => void
  clear: () => void
  addChangeHighlightListener: (listener: PageSearcher.ChangeHighlightListener) => PageSearcher.Unsubscriber
}

namespace PageSearcher {
  export type ChangeHighlightListener = (total: number, current: number) => void
  export type Unsubscriber = () => void
}

interface Store {
  setSearchResult(highlightGroups: HTMLElement[], highlights: HTMLElement[]): void
  clear(): void
  forwardSelectedHighlight(): void
  getSelectedHighlight(): HTMLElement
  onClear(listener: Store.ClearListener): void
  onChangeHighlightSelection(listener: Store.ChangeHighlightSelectionListener): void
}

namespace Store {
  export type ClearListener = (highlightGroups: Node[]) => void
  export type ChangeHighlightSelectionListener = (args: {
    previousHighlight: HTMLElement,
    nextHighlight: HTMLElement,
    total: number,
    nextIndex: number
  }) => void
}

function createStateManager(): Store {
  let highlightGroups: HTMLElement[] = []
  let highlights: HTMLElement[] = []
  let selectedHighlightIndex = 0

  let clearListener: Store.ClearListener | null = null
  let changeHighlightSelectionListener: Store.ChangeHighlightSelectionListener | null = null

  function setSearchResult(hg: HTMLElement[], h: HTMLElement[]) {
    highlightGroups = hg
    highlights = h
    selectedHighlightIndex = 0
    const previousHighlight = highlights[selectedHighlightIndex]
    if (changeHighlightSelectionListener) {
      changeHighlightSelectionListener({
        previousHighlight: previousHighlight,
        nextHighlight: highlights[selectedHighlightIndex],
        total: highlights.length,
        nextIndex: selectedHighlightIndex
      })
    }
  }

  function clear() {
    clearListener(highlightGroups)
    highlightGroups = []
    highlights = []
    selectedHighlightIndex = 0
  }

  function forwardSelectedHighlight() {
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
    forwardSelectedHighlight,
    getSelectedHighlight,
    onClear,
    onChangeHighlightSelection
  }
}

export function createPageSearcher(rootDOM: Node): PageSearcher {
  let changeHighlightListener: PageSearcher.ChangeHighlightListener | null = null
  const stateManager = createStateManager()

  stateManager.onClear((highlights) => {
    highlights.forEach((node) => {
      const newNode = document.createTextNode(node.textContent)
      node.parentNode.replaceChild(newNode, node)
    })
  })

  stateManager.onChangeHighlightSelection(({
    previousHighlight,
    nextHighlight,
    total,
    nextIndex
  }) => {
    previousHighlight.style.backgroundColor = '#ffff00'
    nextHighlight.style.backgroundColor = '#ff8000'

    const offset = -150
    const clientRect = nextHighlight.getBoundingClientRect()
    const y = window.pageYOffset + clientRect.top + offset
    scrollTo(0, y)

    if (changeHighlightListener) {
      changeHighlightListener(total, nextIndex + 1)
    }
  })

  function _searchRecursively(dom: Node, query: string): Node[] {
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
    stateManager.clear()

    const matchedTextNodes = _searchRecursively(rootDOM, query)

    let highlightGroups: HTMLElement[] = []
    let highlights: HTMLElement[] = []
    const matchedTextClass = 'ps-matched-text'
    matchedTextNodes.forEach((node) => {
      const text = node.nodeValue
      const rawHighlightGroup = text.replace(new RegExp(query, 'g'), `<span class="${matchedTextClass}">$&</span>`)

      const highlightGroup = document.createElement('span')
      highlightGroup.innerHTML = rawHighlightGroup
      const groupHighlights = highlightGroup.querySelectorAll<HTMLElement>(`span.${matchedTextClass}`)

      highlightGroups.push(highlightGroup)
      highlights = [...highlights, ...groupHighlights]

      node.parentNode.replaceChild(highlightGroup, node)
    })

    stateManager.setSearchResult(highlightGroups, highlights);
  }

  function nextResult() {
    stateManager.forwardSelectedHighlight()
  }

  function clear() {
    stateManager.clear()
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
    clear,
    addChangeHighlightListener
  }
}
