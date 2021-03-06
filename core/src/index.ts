import { createStore } from "./store"

interface HighlightGroup {
  clear(): void
}

interface Highlight {
  select(): void
  unselect(): void
}

export interface PageSearcher {
  search(query: string, flags: string): void
  nextResult(): void
  previousResult(): void
  clear(): void
  addChangeHighlightListener(listener: PageSearcher.ChangeHighlightListener): PageSearcher.Unsubscriber
  addSearchedListener(listener: PageSearcher.SearchedListener): PageSearcher.Unsubscriber
  addClearListener(listener: PageSearcher.ClearListener): PageSearcher.Unsubscriber
  addErrorListener(listener: PageSearcher.ErrorListener): PageSearcher.Unsubscriber
}

type GlobalError = Error
export namespace PageSearcher {
  export type ChangeHighlightListener = (current: number) => void
  export type SearchedListener = (total: number) => void
  export type ClearListener = () => void
  export type ErrorListener = (error: PageSearcher.Error) => void
  export type Unsubscriber = () => void

  export enum ErrorType {
    InvalidFlags, Unhandled
  }
  export interface InvalidFlagsError {
    type: ErrorType.InvalidFlags
  }
  export interface UnhandledError {
    type: ErrorType.Unhandled
    error: GlobalError
  }
  export type Error = InvalidFlagsError | UnhandledError
}

function createHighlightGroup(highlightGroupDOM: HTMLElement): HighlightGroup {
  function clear() {
    const newNode = document.createTextNode(highlightGroupDOM.textContent || '')
    highlightGroupDOM.parentNode?.replaceChild(newNode, highlightGroupDOM)
  }
  highlightGroupDOM.setAttribute(HighlightGroup.HIGHLIGHT_GROUP_DOM_ATTRIBUTE, HighlightGroup.HIGHLIGHT_GROUP_DOM_ATTRIBUTE)

  return {
    clear
  }
}
namespace HighlightGroup {
  export const HIGHLIGHT_GROUP_DOM_ATTRIBUTE = 'data-highlight-group'

  // Clear HighlightGroups whenever elements refreshed.
  export function clearAll() {
    document.querySelectorAll<HTMLElement>(`[${HIGHLIGHT_GROUP_DOM_ATTRIBUTE}=${HIGHLIGHT_GROUP_DOM_ATTRIBUTE}]`).forEach((dom) => {
      const highlightGroup = createHighlightGroup(dom)
      highlightGroup.clear()
    })
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

export function createPageSearcher(rootDOM: HTMLElement): PageSearcher {
  let changeHighlightListener: PageSearcher.ChangeHighlightListener | null = null
  let searchedListener: PageSearcher.SearchedListener | null = null
  let clearListener: PageSearcher.ClearListener | null = null
  let errorListener: PageSearcher.ErrorListener | null = null
  const store = createStore<HighlightGroup, Highlight>()

  store.onClear((_highlightGroups) => {
    HighlightGroup.clearAll()
    if (clearListener) {
      clearListener()
    }
  })

  store.onSearched(({
    initialHighlight,
    total
  }) => {
    initialHighlight?.select()
    if (searchedListener) {
      searchedListener(total)
    }
  })

  store.onChangeHighlightSelection(({
    previousHighlight,
    nextHighlight,
    nextIndex
  }) => {
    if (previousHighlight) {
      previousHighlight.unselect()
    }
    if (nextHighlight) {
      nextHighlight.select()
    }

    if (changeHighlightListener) {
      changeHighlightListener(nextIndex)
    }
  })

  function getTextNodes(rootDOM: Node): [Node[], number[]] {
    function _getTextNodes(rootDOM: Node): [Node[], number[], number] {
      let nodes: Node[] = []
      let nodeTextStartIndices: number[] = []

      let textIndex = 0 
      rootDOM.childNodes.forEach((node) => {
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
    const result = _getTextNodes(rootDOM)
    return [result[0], result[1]]
  }

  function search(query: string, flags: string) {
    if (query === '') {
      store.clear()
      return
    }
    if (!store.isCleared()) {
      store.clear()
    }

    let queryRegExp: RegExp | Error
      try {
        queryRegExp = new RegExp(query, flags)
      } catch (e) {
        queryRegExp = e
      }
    if (queryRegExp instanceof Error) {
      if (errorListener) {
        const mappedError: PageSearcher.Error = (() => {
          if (queryRegExp.message.includes('flags')) {
            return {
              type: PageSearcher.ErrorType.InvalidFlags,
            } as PageSearcher.InvalidFlagsError
          } else {
            return {
              type: PageSearcher.ErrorType.Unhandled,
              error: queryRegExp
            } as PageSearcher.UnhandledError
          }
        })()
        errorListener(mappedError)
      }
      return
    }

    function htmlElementIsVisible(element: HTMLElement): boolean {
      const rect = element.getBoundingClientRect()
      const left = window.pageXOffset + rect.left
      const right = window.pageXOffset + rect.right
      const top = window.pageYOffset + rect.top
      const bottom = window.pageYOffset + rect.bottom
      const isIn = right > 0 && left < rootDOM.scrollWidth && bottom > 0 && top < rootDOM.scrollHeight
      return !!element.offsetParent && !element.hidden && isIn
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

    let [nodes, nodeTextStartIndices] = getTextNodes(rootDOM)

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

      let isMatched = false
      for (let j = 0; j < matchedTextStartIndices.length; j++) {
        const matchedTextStartIndex = matchedTextStartIndices[j]
        const matchedTextEndIndex = matchedTextEndIndices[j]
        if (matchedTextEndIndex > nodeTextStartIndex && matchedTextStartIndex < nodeTextEndIndex) {
          isMatched = true
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

      if (isMatched) {
        node.parentNode?.replaceChild(highlightGroupDOM, node)

        highlightGroups.push(createHighlightGroup(highlightGroupDOM))
      }
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

  function addSearchedListener(listener: PageSearcher.SearchedListener) {
    searchedListener = listener
    return () => {
      searchedListener = null
    }
  }

  function addClearListener(listener: PageSearcher.ClearListener) {
    clearListener = listener
    return () => {
      clearListener = null
    }
  }

  function addErrorListener(listener: PageSearcher.ErrorListener) {
    errorListener = listener
    return () => {
      errorListener = null
    }
  }

  return {
    search,
    nextResult,
    previousResult,
    clear,
    addChangeHighlightListener,
    addSearchedListener,
    addClearListener,
    addErrorListener
  }
}
