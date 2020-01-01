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

function initialize() {
  const pageSearcher = createPageSearcher(document.body)

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (isSearch(request)) {
      const doms = pageSearcher.search(request.payload.query)
      console.log('doms: ', doms)
    }

    // Send an empty response
    // See https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-531531890
    sendResponse({});
    return true;
  });
}

initialize()
