import { isSearch, isNextResult, isClearResult, ChangeHighlight, MessageType, isPreviousResult, isGetCursorSelection } from "./message-type"
import { createPageSearcher } from "./core/page-searcher";

declare global {
  interface Window {
    CHROME_REGEXP_FINDER_IS_INITIALIZED: boolean | undefined,
  }
}

function initialize() {
  if (window.CHROME_REGEXP_FINDER_IS_INITIALIZED) return
  window.CHROME_REGEXP_FINDER_IS_INITIALIZED = true

  const pageSearcher = createPageSearcher(document.body)

  pageSearcher.addChangeHighlightListener((total, current) => {
    const message: ChangeHighlight = {
      type: MessageType.ChangeHighlight,
      payload: {
        total,
        current
      }
    }
    chrome.runtime.sendMessage(message)
  })

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (isSearch(request)) {
      pageSearcher.search(request.payload.query)
    } else if (isNextResult(request)) {
      pageSearcher.nextResult()
    } else if (isPreviousResult(request)) {
      pageSearcher.previousResult()
    } else if (isClearResult(request)) {
      pageSearcher.clear()
    } else if (isGetCursorSelection(request)) {
      const text = window.getSelection()?.toString()
      if (text) {
        sendResponse({
          text
        })
        return true
      }
    }

    // Send an empty response
    // See https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-531531890
    sendResponse({});
    return true;
  });
}

initialize()
