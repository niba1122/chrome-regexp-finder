import { ChangeHighlightMessage, MessageType, SearchedMessage, ClearedMessage, ErrorMessage, Message } from "./message-type"

import { PageSearcher } from "@chrome-regexp-finder/core";

type PageSearcherFactory = (rootDOM: HTMLElement) => PageSearcher

const loadRuntime: () => Promise<PageSearcherFactory> = () => new Promise((resolve) => {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'RESPONSE_CORE_RUNTIME') {
      const code = message.code;
      const loadRuntime = new Function(code)
      loadRuntime()
      resolve(window.createPageSearcher)
    }
  })
})

declare global {
  interface Window {
    CHROME_REGEXP_FINDER_IS_INITIALIZED: boolean | undefined,
    createPageSearcher: PageSearcherFactory
  }
}

class MultiUnsubscriber {
  private unsubscribers: MultiUnsubscriber.Unsubscriber[] = []

  add(unsubscriber: MultiUnsubscriber.Unsubscriber) {
    this.unsubscribers.push(unsubscriber)
  }
  unsubscribeAll() {
    this.unsubscribers.forEach((unsubscriber) => {
      unsubscriber()
    })
  }
}
namespace MultiUnsubscriber {
  export type Unsubscriber = () => void
}

let unsubscribeAll: (() => void) | null = null

async function initialize() {
  if (unsubscribeAll) {
    unsubscribeAll()
  }

  chrome.runtime.sendMessage({
    type: 'REQUEST_CORE_RUNTIME'
  })

  const createPageSearcher = await loadRuntime()

  const pageSearcher = createPageSearcher(document.body)

  const unsubscribers = new MultiUnsubscriber()

  unsubscribers.add(pageSearcher.addSearchedListener((total) => {
    const message: SearchedMessage = {
      type: MessageType.Searched,
      payload: {
        total
      }
    }
    chrome.runtime.sendMessage(message)
  }))

  unsubscribers.add(pageSearcher.addChangeHighlightListener((current) => {
    const message: ChangeHighlightMessage = {
      type: MessageType.ChangeHighlight,
      payload: {
        current
      }
    }
    chrome.runtime.sendMessage(message)
  }))

  unsubscribers.add(pageSearcher.addClearListener(() => {
    const message: ClearedMessage = {
      type: MessageType.Cleared
    }
    chrome.runtime.sendMessage(message)
  }))

  unsubscribers.add(pageSearcher.addErrorListener((error) => {
    const message: ErrorMessage = {
      type: MessageType.Error,
      payload: {
        error
      }
    }
    chrome.runtime.sendMessage(message)
  }))

  type MessageListener = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => void
  const handleMessage: MessageListener = (request, _, sendResponse) => {
    if (request.type === 'RELOAD_RUNTIME') {
      initialize()
      sendResponse({});
      return
    }

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
  }
  chrome.runtime.onMessage.addListener(handleMessage)
  unsubscribers.add(() => {
    chrome.runtime.onMessage.removeListener(handleMessage)
  })

  unsubscribeAll = () => unsubscribers.unsubscribeAll()
}

initialize()
