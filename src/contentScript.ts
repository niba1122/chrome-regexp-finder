import { ChangeHighlightMessage, MessageType, SearchedMessage, ClearedMessage, ErrorMessage, Message } from "./message-type"
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

  pageSearcher.addSearchedListener((total) => {
    const message: SearchedMessage = {
      type: MessageType.Searched,
      payload: {
        total
      }
    }
    chrome.runtime.sendMessage(message)
  })

  pageSearcher.addChangeHighlightListener((current) => {
    const message: ChangeHighlightMessage = {
      type: MessageType.ChangeHighlight,
      payload: {
        current
      }
    }
    chrome.runtime.sendMessage(message)
  })

  pageSearcher.addClearListener(() => {
    const message: ClearedMessage = {
      type: MessageType.Cleared
    }
    chrome.runtime.sendMessage(message)
  })

  pageSearcher.addErrorListener((error) => {
    const message: ErrorMessage = {
      type: MessageType.Error,
      payload: {
        error
      }
    }
    chrome.runtime.sendMessage(message)
  })

  chrome.runtime.onMessage.addListener((request: Message, _sender, sendResponse) => {
    if (request.type === MessageType.Search) {
      pageSearcher.search(request.payload.query, request.payload.flags)
    } else if (request.type === MessageType.NextResult) {
      pageSearcher.nextResult()
    } else if (request.type === MessageType.PreviousResult) {
      pageSearcher.previousResult()
    } else if (request.type === MessageType.ClearResult) {
      pageSearcher.clear()
    } else if (request.type === MessageType.GetCursorSelection) {
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
