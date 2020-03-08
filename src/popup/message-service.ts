import { Search, MessageType, NextResult, PreviousResult, GetCursorSelection, isChangeHighlight, ChangeHighlight, Searched, isSearched, Cleared, isCleared } from "../message-type";

export function subscribeSearchedMessage(callback: (request: Searched) => void) {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (isSearched(request)) {
      callback(request)
    }
    sendResponse({})
    return true
  })
}

export function subscribeChangeHighlightMessage(callback: (request: ChangeHighlight) => void) {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (isChangeHighlight(request)) {
      callback(request)
    }
    sendResponse({})
    return true
  })
}

export function subscribeClearedMessage(callback: (request: Cleared) => void) {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (isCleared(request)) {
      callback(request)
    }
    sendResponse({})
    return true
  })
}

export function sendGetCursorSelectionMessage(callback: (text: string | undefined) => void) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (tab.id) {
      const message: GetCursorSelection = {
        type: MessageType.GetCursorSelection,
        payload: undefined
      }
      chrome.tabs.sendMessage(
        tab.id,
        message,
        (response) => {
          callback(response.text)
        }
      )
    }
  })
}

export function sendSearchMessage(query: string) {
  const message: Search = {
    type: MessageType.Search,
    payload: {
      query
    }
  }

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0]
    if (tab.id) {
      chrome.tabs.sendMessage(
        tab.id,
        message
      );
    }
  });
}

export function sendNextResultMessage() {
  const message: NextResult = {
    type: MessageType.NextResult,
    payload: undefined
  }

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (tab.id) {
      chrome.tabs.sendMessage(
        tab.id,
        message
      );
    }
  });
}

export function sendPreviousResultMessage() {
  const message: PreviousResult = {
    type: MessageType.PreviousResult,
    payload: undefined
  }

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (tab.id) {
      chrome.tabs.sendMessage(
        tab.id,
        message
      );
    }
  });
}
