import { SearchMessage, MessageType, NextResultMessage, PreviousResultMessage, GetCursorSelectionMessage, ChangeHighlightMessage, SearchedMessage, ClearedMessage, ErrorMessage, Message, ClearResultMessage } from "./message-type";

type TabIdGetter = () => Promise<number | undefined | null>

export function getMessageService(getTabId: TabIdGetter) {
  function subscribeSearchedMessage(callback: (request: SearchedMessage) => void) {
    chrome.runtime.onMessage.addListener((request: Message, _sender, sendResponse) => {
      if (request.type === MessageType.Searched) {
        callback(request)
      }
      sendResponse({})
      return true
    })
  }

  function subscribeChangeHighlightMessage(callback: (request: ChangeHighlightMessage) => void) {
    chrome.runtime.onMessage.addListener((request: Message, _sender, sendResponse) => {
      if (request.type === MessageType.ChangeHighlight) {
        callback(request)
      }
      sendResponse({})
      return true
    })
  }

  function subscribeClearedMessage(callback: (request: ClearedMessage) => void) {
    chrome.runtime.onMessage.addListener((request: Message, _sender, sendResponse) => {
      if (request.type === MessageType.Cleared) {
        callback(request)
      }
      sendResponse({})
      return true
    })
  }

  function subscribeErrorMessage(callback: (request: ErrorMessage) => void) {
    chrome.runtime.onMessage.addListener((request: Message, _sender, sendResponse) => {
      if (request.type === MessageType.Error) {
        callback(request)
      }
      sendResponse({})
      return true
    })
  }

  function sendGetCursorSelectionMessage(callback: (text: string | undefined) => void) {
    getTabId().then((tabId) => {
      if (tabId) {
        const message: GetCursorSelectionMessage = {
          type: MessageType.GetCursorSelection
        }
        chrome.tabs.sendMessage(
          tabId,
          message,
          (response) => {
            callback(response.text)
          }
        )
      }
    })
  }

  function sendSearchMessage(query: string, flags: string) {
    getTabId().then((tabId) => {
      if (tabId) {
        const message: SearchMessage = {
          type: MessageType.Search,
          payload: {
            query,
            flags
          }
        }
        chrome.tabs.sendMessage(
          tabId,
          message
        )
      }
    })
  }

  function sendNextResultMessage() {
    getTabId().then((tabId) => {
      if (tabId) {
        const message: NextResultMessage = {
          type: MessageType.NextResult
        }
        chrome.tabs.sendMessage(
          tabId,
          message
        )
      }
    })
  }

  function sendPreviousResultMessage() {
    getTabId().then((tabId) => {
      if (tabId) {
        const message: PreviousResultMessage = {
          type: MessageType.PreviousResult
        }
        chrome.tabs.sendMessage(
          tabId,
          message
        )
      }
    })
  }

  function sendClearResultMessage() {
    getTabId().then((tabId) => {
      if (tabId) {
        const message: ClearResultMessage = {
          type: MessageType.ClearResult
        }
        chrome.tabs.sendMessage(
          tabId,
          message
        )
      }
    })
  }

  return {
    subscribeSearchedMessage,
    subscribeChangeHighlightMessage,
    subscribeClearedMessage,
    subscribeErrorMessage,
    sendGetCursorSelectionMessage,
    sendSearchMessage,
    sendNextResultMessage,
    sendPreviousResultMessage,
    sendClearResultMessage
  }
}
