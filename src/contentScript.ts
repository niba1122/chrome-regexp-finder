import { isSearch, isNextResult } from "./message-type"

interface PageSearcher {
  search: (query: string) => Node[]
}

function createPageSearcher(rootDOM: Node): PageSearcher {
  function _searchRecursively(dom: Node, query: string): Node[] {
    let matchedNodes: Node[] = []
    dom.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.nodeValue && node.nodeValue.match(query)) {
          matchedNodes.push(node)
        }
      } else {
        matchedNodes = matchedNodes.concat(_searchRecursively(node, query))
      }
    })
    return matchedNodes
  }

  function search(query: string) {
    const matchedDOMs = _searchRecursively(rootDOM, query)
    return matchedDOMs
  }

  return {
    search
  }
}

function scrollToElement(element: Element, offset: number = 100) {
  const clientRect = element.getBoundingClientRect()
  const y = window.pageYOffset + clientRect.top + offset
  scrollTo(0, y)
}

const MatchedTextClass = 'ps-matched-text'
const HighlightedClass = 'ps-highlighted'

function initialize() {
  const styleDOM = document.createElement('style')
  styleDOM.textContent = `
.${MatchedTextClass} {
  background-color: #ffff00;
}
.${MatchedTextClass}.${HighlightedClass} {
  background-color: #ff8000;
}
`
  document.head.appendChild(styleDOM)

  const pageSearcher = createPageSearcher(document.body)

  let matchedSentences: Node[] = []
  let matchedTexts: Node[] = []
  let resultIndex = 0

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {

    if (isSearch(request)) {
      matchedSentences.forEach((node) => {
        const newNode = document.createTextNode(node.textContent)
        node.parentNode.replaceChild(newNode, node)
      })

      const nodes = pageSearcher.search(request.payload.query)

      const newNodes: Node[] = []
      nodes.forEach((node) => {
        const text = node.nodeValue
        const t = text.replace(new RegExp(request.payload.query, 'g'), `<span class="${MatchedTextClass}">$&</span>`)

        const newNode = document.createElement('span')
        newNode.innerHTML = t
        newNode.classList.add('ps-matched-sentence')

        newNodes.push(newNode)

        node.parentNode.replaceChild(newNode, node)
      })

      matchedSentences = newNodes
      matchedTexts = Array.from(document.querySelectorAll('span.ps-matched-text'))
      resultIndex = 0
    } else if (isNextResult(request)) {
      (matchedTexts[resultIndex] as Element).classList.remove(HighlightedClass)
      resultIndex++
      if (matchedTexts.length === resultIndex) {
        resultIndex = 0
      }
      (matchedTexts[resultIndex] as Element).classList.add(HighlightedClass)
      scrollToElement(matchedTexts[resultIndex] as Element, -150)
    }

    // Send an empty response
    // See https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-531531890
    sendResponse({});
    return true;
  });
}

initialize()
