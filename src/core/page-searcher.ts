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

export function createPageSearcher(rootDOM: HTMLElement): PageSearcher {
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
      } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SCRIPT') {
        let [childNodes, childNodeTextStartIndices, childTextCount] = _getTextNodes(node)
        nodes = nodes.concat(childNodes)
        nodeTextStartIndices = nodeTextStartIndices.concat(childNodeTextStartIndices.map((i) => i + textIndex))
        textIndex += childTextCount
      }

    })
    return [nodes, nodeTextStartIndices, textIndex]
  }

  function search2(dom: HTMLElement, query: RegExp) {
    const allText = dom.textContent
    if (!allText) return
    console.log(allText.length)

    let match 
    let matchedTexts = []
    let matchedTextStartIndices = []
    let matchedTextEndIndices = []
    while (match = query.exec(allText)) {
      const matchedText = match[0]
      matchedTexts.push(matchedText)
      matchedTextStartIndices.push(match.index)
      matchedTextEndIndices.push(match.index + matchedText.length)
    }

    let [nodes, nodeTextStartIndices] = _getTextNodes(dom)

    console.log(nodeTextStartIndices)
    console.log(matchedTextStartIndices)

    for (let i = 0; i < matchedTexts.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        const matchedTextStartIndex = matchedTextStartIndices[i]
        const matchedTextEndIndex = matchedTextEndIndices[i]
        const nodeTextStartIndex = nodeTextStartIndices[j]
        const nodeTextEndIndex = nodeTextStartIndices[j + 1] || nodes.length
        if (nodeTextEndIndex > matchedTextStartIndex && nodeTextStartIndex < matchedTextEndIndex) {
          // if (nodeTextStartIndex < matchedTextStartIndex && nodeTextEndIndex <= matchedTextEndIndex) {
          //   const startIndexInNodeText = matchedTextStartIndex
          //   const endIndexInNodeText = nodeTextEndIndex
          // } else if (nodeTextStartIndex < matchedTextStartIndex && nodeTextEndIndex > matchedTextEndIndex) {
          //   const startIndexInNodeText = matchedTextStartIndex
          //   const endIndexInNodeText = matchedTextEndIndex
          // } else if (nodeTextStartIndex >= matchedTextStartIndex && nodeTextEndIndex <= matchedTextEndIndex) {
          //   const startIndexInNodeText = nodeTextStartIndex
          //   const endIndexInNodeText = nodeTextEndIndex
          // } else if (nodeTextStartIndex >= matchedTextStartIndex && nodeTextEndIndex > matchedTextEndIndex) {
          //   const startIndexInNodeText = nodeTextStartIndex
          //   const endIndexInNodeText = matchedTextEndIndex
          // }

          const startIndex = nodeTextStartIndex < matchedTextStartIndex ? matchedTextStartIndex : nodeTextStartIndex
          const endIndex = nodeTextEndIndex > matchedTextEndIndex ? matchedTextEndIndex : nodeTextEndIndex
        }
      }
    }

    // for (let i = 0; i < nodes.length; i++) {
    //   for (let j = 0; j < matchedTexts.length; j++) {
    //     const node = nodes[i]
    //     const nodeTextStartIndex = nodeTextStartIndices[i]
    //     const previousNodeTextEndIndex = nodeTextStartIndex
    //     const matchedTextStartIndex = matchedTextStartIndices[j]
    //     const matchedTextEndIndex = matchedTextEndIndices[j]

    //     if (matchedTextEndIndex < ) break
    //     if (matchedTextStartIndex >= nodeTextStartIndex) break
    //     if ()
    //   }
    // }

    // console.log(allText)
    // const matchedTexts = allText?.match(query)
    // if (!matchedTexts) return
    // console.log(matchedText)
    // console.log(Array.from(new Set(result)).sort((a, b) => b.length - a.length))

    // const textNodes = _getTextNodes(dom)

    // function _partialMatch(startIndex: number, endIndex: number, partialTexts: string[]) {
    //   // const currentNode = textNodes[index]
    //   const nodes = textNodes.slice(startIndex, endIndex)

    //   const text = nodes.map((node) => node.textContent).join('')
    //   for (let i = 0; i < partialTexts.length; i++) {
    //     const partialText = partialTexts[i]
    //     const res = text.match(partialText)
    //     if (!res || !res.index) continue
    //     const isEnd = (res.index + partialText.length) === text.length

    //     if (isEnd) {

    //       break
    //     }
    //   }
    // }

    // let matchedTextNodes: Node[] = []
    // for (let i = 0; i < textNodes.length; i++) {
    //   const node = textNodes[i]

    //   for (let j = 0; j < matchedTexts.length; j++) {
    //     const willMatchText = matchedTexts[j]
    //     const nodeText = node.textContent
    //     if (!nodeText) continue
    //     const res = nodeText.substr(0, nodeText.length).replace(willMatchText, '[highlighted]') + nodeText.slice(nodeText.length) // 最後以外
    //     if (res != nodeText) {
    //       node.textContent = res
    //       break
    //     }

    //   }
    //   for (let j = 0; j < matchedTexts.length; j++) {
    //     const willMatchText = matchedTexts[j]
    //     let partialTexts: string[] = []
    //     for (let k = 0; k < willMatchText.length; k++) {
    //       partialTexts.push(willMatchText.substr(0, j + 1))
    //     }
    //   }
    // }
    // console.log(textNodes.map((node) => node.textContent))
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
    // console.log(_getTextNodes(rootDOM).map((node) => node.nodeValue))
    search2(rootDOM, queryRegExp)
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
