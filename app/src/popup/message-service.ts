import { SearchMessage, MessageType, NextResultMessage, PreviousResultMessage, GetCursorSelectionMessage, ChangeHighlightMessage, SearchedMessage, ClearedMessage, ErrorMessage, Message } from "../message-type";

export function subscribeSearchedMessage(callback: (request: SearchedMessage) => void) {
  chrome.runtime.onMessage.addListener((request: Message, _sender, sendResponse) => {
    if (request.type === MessageType.Searched) {
      callback(request)
    }
    sendResponse({})
    return true
  })
}

export function subscribeChangeHighlightMessage(callback: (request: ChangeHighlightMessage) => void) {
  chrome.runtime.onMessage.addListener((request: Message, _sender, sendResponse) => {
    if (request.type === MessageType.ChangeHighlight) {
      callback(request)
    }
    sendResponse({})
    return true
  })
}

export function subscribeClearedMessage(callback: (request: ClearedMessage) => void) {
  chrome.runtime.onMessage.addListener((request: Message, _sender, sendResponse) => {
    if (request.type === MessageType.Cleared) {
      callback(request)
    }
    sendResponse({})
    return true
  })
}

export function subscribeErrorMessage(callback: (request: ErrorMessage) => void) {
  chrome.runtime.onMessage.addListener((request: Message, _sender, sendResponse) => {
    if (request.type === MessageType.Error) {
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
      const message: GetCursorSelectionMessage = {
        type: MessageType.GetCursorSelection
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

export function sendSearchMessage(query: string, flags: string) {
  const message: SearchMessage = {
    type: MessageType.Search,
    payload: {
      query,
      flags
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
  const message: NextResultMessage = {
    type: MessageType.NextResult
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
  const message: PreviousResultMessage = {
    type: MessageType.PreviousResult
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
