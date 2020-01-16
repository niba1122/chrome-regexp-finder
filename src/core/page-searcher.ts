interface HighlightGroup {
  clear(): void
}

interface Highlight {
  select(): void
  unselect(): void
}

interface Store<HG, H> {
  setSearchResult(highlightGroups: HG[], highlights: H[]): void
  clear(): void
  isCleared(): boolean
  forwardSelectedHighlight(): void
  backwardSelectedHighlight(): void
  getSelectedHighlight(): H
  onClear(listener: Store.ClearListener<HG>): void
  onChangeHighlightSelection(listener: Store.ChangeHighlightSelectionListener<H>): void
}

namespace Store {
  export type ClearListener<HG> = (highlightGroups: HG[]) => void
  export type ChangeHighlightSelectionListener<H> = (args: {
    previousHighlight?: H,
    nextHighlight?: H,
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

function createHighlightGroup(highlightGroupDOM: HTMLElement): HighlightGroup {
  function clear() {
    const newNode = document.createTextNode(highlightGroupDOM.textContent || '')
    highlightGroupDOM.parentNode?.replaceChild(newNode, highlightGroupDOM)
  }

  return {
    clear
  }
}

function createHighlight(doms: HTMLElement[]): Highlight {
  const highlightColor = '#ffff00'
  const selectedHighlightColor = '#ff8000'

  doms.forEach((dom) => {
    dom.style.backgroundColor = highlightColor
  })

  function select() {
    doms.forEach((dom) => {
      dom.style.backgroundColor = selectedHighlightColor
    })

    const offset = -150
    const clientRect = doms[0].getBoundingClientRect()
    const y = window.pageYOffset + clientRect.top + offset
    scrollTo(0, y)
  }
  function unselect() {
    doms.forEach((dom) => {
      dom.style.backgroundColor = highlightColor
    })
  }
  return {
    select,
    unselect
  }
}

function createStore<HG, H>(): Store<HG, H> {
  let highlightGroups: HG[] = []
  let highlights: H[] = []
  let selectedHighlightIndex = 0

  let clearListener: Store.ClearListener<HG> | null = null
  let changeHighlightSelectionListener: Store.ChangeHighlightSelectionListener<H> | null = null

  function setSearchResult(hg: HG[], h: H[]) {
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

  function getSelectedHighlight(): H {
    return highlights[selectedHighlightIndex]
  }

  function onClear(listener: Store.ClearListener<HG>) {
    clearListener = listener
  }

  function onChangeHighlightSelection(listener: Store.ChangeHighlightSelectionListener<H>) {
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

export function createPageSearcher(rootDOM: HTMLElement): PageSearcher {
  let changeHighlightListener: PageSearcher.ChangeHighlightListener | null = null
  const store = createStore<HighlightGroup, Highlight>()

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

  function _getTextNodes(dom: Node): [Node[], number[], number] {
    let nodes: Node[] = []
    let nodeTextStartIndices: number[] = []

    let textIndex = 0 
    dom.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent) {
          nodes.push(node)
          nodeTextStartIndices.push(textIndex)
          textIndex += node.textContent.length
        }
      } else {
        let [childNodes, childNodeTextStartIndices, childTextCount] = _getTextNodes(node)
        nodes = nodes.concat(childNodes)
        nodeTextStartIndices = nodeTextStartIndices.concat(childNodeTextStartIndices.map((i) => i + textIndex))
        textIndex += childTextCount
      }

    })
    return [nodes, nodeTextStartIndices, textIndex]
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

    function htmlElementIsVisible(element: HTMLElement): boolean {
      return !!element.offsetParent && !element.hidden
    }

    const allText = rootDOM.textContent
    if (!allText) return

    let match 
    let matchedTextStartIndices = []
    let matchedTextEndIndices = []
    while (match = queryRegExp.exec(allText)) {
      const matchedText = match[0]
      matchedTextStartIndices.push(match.index)
      matchedTextEndIndices.push(match.index + matchedText.length)
    }

    let [nodes, nodeTextStartIndices] = _getTextNodes(rootDOM)

    let highlightGroups: HighlightGroup[] = []
    let highlightDOMs: HTMLElement[][] = matchedTextStartIndices.map(() => [])

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (node.parentNode?.nodeName === 'SCRIPT' || node.parentNode?.nodeName === 'NOSCRIPT') continue
      const currentText = node.textContent
      if (!currentText) continue

      const highlightGroupDOM = document.createElement('span')

      const nodeTextStartIndex = nodeTextStartIndices[i]
      const nodeTextEndIndex = nodeTextStartIndices[i + 1] || nodes.length

      let clipStartIndex = nodeTextStartIndex
      let clipEndIndex = nodeTextStartIndex

      for (let j = 0; j < matchedTextStartIndices.length; j++) {
        const matchedTextStartIndex = matchedTextStartIndices[j]
        const matchedTextEndIndex = matchedTextEndIndices[j]
        if (matchedTextEndIndex > nodeTextStartIndex && matchedTextStartIndex < nodeTextEndIndex) {
          const replaceStartIndex = matchedTextStartIndex < nodeTextStartIndex ? nodeTextStartIndex : matchedTextStartIndex
          const replaceEndIndex = matchedTextEndIndex > nodeTextEndIndex ? nodeTextEndIndex : matchedTextEndIndex

          clipStartIndex = clipEndIndex
          clipEndIndex = replaceStartIndex
          highlightGroupDOM.appendChild(
            document.createTextNode(
              currentText.substring(clipStartIndex - nodeTextStartIndex, clipEndIndex - nodeTextStartIndex)
            )
          )

          clipStartIndex = replaceStartIndex
          clipEndIndex = replaceEndIndex
          const highlightDOM = document.createElement('span')
          highlightDOM.textContent = currentText.substring(clipStartIndex - nodeTextStartIndex, clipEndIndex - nodeTextStartIndex)
          highlightGroupDOM.appendChild(highlightDOM)
          highlightDOMs[j].push(highlightDOM)
        }
      }
      clipStartIndex = clipEndIndex
      clipEndIndex = nodeTextEndIndex
      highlightGroupDOM.appendChild(
        document.createTextNode(
          currentText.substring(clipStartIndex - nodeTextStartIndex, clipEndIndex - nodeTextStartIndex)
        )
      )

      node.parentNode?.replaceChild(highlightGroupDOM, node)

      highlightGroups.push(createHighlightGroup(highlightGroupDOM))
    }

    let highlights = highlightDOMs.filter((doms) => doms.length > 0 && doms.every(htmlElementIsVisible)).map((doms) => createHighlight(doms))

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
