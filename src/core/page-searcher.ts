type ChangeHighlightListener = (total: number, current: number) => void
type Unsubscriber = () => void

interface PageSearcher {
  search: (query: string) => void
  nextResult: () => void
  clear: () => void
  addChangeHighlightListener: (listener: ChangeHighlightListener) => Unsubscriber
}

export function createPageSearcher(rootDOM: Node): PageSearcher {
  let matchedSentences: Node[] = []
  let matchedTexts: Node[] = []
  let resultIndex = 0
  let changeHighlightListener: ChangeHighlightListener | null = null

  function scrollToElement(element: Element, offset: number = 100) {
    const clientRect = element.getBoundingClientRect()
    const y = window.pageYOffset + clientRect.top + offset
    scrollTo(0, y)
  }

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
    const matchedNodes = _searchRecursively(rootDOM, query)

    matchedSentences.forEach((node) => {
      const newNode = document.createTextNode(node.textContent)
      node.parentNode.replaceChild(newNode, node)
    })

    const newNodes: Node[] = []
    matchedNodes.forEach((node) => {
      const text = node.nodeValue
      const t = text.replace(new RegExp(query, 'g'), `<span class="ps-matched-text" style="background-color: #ffff00;">$&</span>`)

      const newNode = document.createElement('span')
      newNode.innerHTML = t
      newNode.classList.add('ps-matched-sentence')

      newNodes.push(newNode)

      node.parentNode.replaceChild(newNode, node)
    })

    matchedSentences = newNodes
    matchedTexts = Array.from(document.querySelectorAll('span.ps-matched-text'))
    resultIndex = 0;
    (matchedTexts[resultIndex] as HTMLElement).style.backgroundColor = '#ff8000'
    scrollToElement(matchedTexts[resultIndex] as Element, -150)
    if (changeHighlightListener) {
      changeHighlightListener(matchedTexts.length, resultIndex + 1)
    }
  }

  function nextResult() {
    (matchedTexts[resultIndex] as HTMLElement).style.backgroundColor = '#ffff00'
    resultIndex++
    if (matchedTexts.length === resultIndex) {
      resultIndex = 0
    }
    (matchedTexts[resultIndex] as HTMLElement).style.backgroundColor = '#ff8000'
    scrollToElement(matchedTexts[resultIndex] as Element, -150)
    if (changeHighlightListener) {
      changeHighlightListener(matchedTexts.length, resultIndex + 1)
    }
  }

  function clear() {
    matchedSentences.forEach((node) => {
      const newNode = document.createTextNode(node.textContent)
      node.parentNode.replaceChild(newNode, node)
    })
    matchedSentences = []
    matchedTexts = []
    resultIndex = 0
    if (changeHighlightListener) {
      changeHighlightListener(matchedTexts.length, resultIndex + 1)
    }
  }

  function addChangeHighlightListener(listener: ChangeHighlightListener) {
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
