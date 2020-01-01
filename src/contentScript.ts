import { isSearch } from "./message-type"

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

let matchedNodes: Node[] = []

function initialize() {
  const pageSearcher = createPageSearcher(document.body)

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {

    if (isSearch(request)) {
      matchedNodes.forEach((node) => {
        const newNode = document.createTextNode(node.textContent)
        node.parentNode.replaceChild(newNode, node)
      })

      const nodes = pageSearcher.search(request.payload.query)

      const newNodes: Node[] = []
      nodes.forEach((node) => {
        const text = node.nodeValue
        const t = text.replace(new RegExp(request.payload.query, 'g'), '<span style="background-color: #ff8000;">$&</span>')

        const newNode = document.createElement('span')
        newNode.innerHTML = t
        newNode.classList.add('ps-highlighted')

        newNodes.push(newNode)

        node.parentNode.replaceChild(newNode, node)
      })

      matchedNodes = newNodes
    }

    // Send an empty response
    // See https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-531531890
    sendResponse({});
    return true;
  });
}

initialize()
