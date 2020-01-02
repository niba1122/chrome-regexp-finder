import { isSearch, isNextResult, isClearResult, ChangeHighlight, MessageType } from "./message-type"
import { createPageSearcher } from "./core/page-searcher";

function initialize() {
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
    } else if (isClearResult(request)) {
      pageSearcher.clear()
    }

    // Send an empty response
    // See https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-531531890
    sendResponse({});
    return true;
  });
}

initialize()
