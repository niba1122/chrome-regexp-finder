'use strict';

import './popup.css';
import { Search, MessageType, NextResult, ClearResult, isChangeHighlight, PreviousResult, GetCursorSelection } from './message-type';

const searchFormTextDOM = document.getElementById('search-form-text') as HTMLInputElement
const searchResultTotalDOM = document.getElementById('search-result-total') as HTMLElement
const searchResultCurrentDOM = document.getElementById('search-result-current') as HTMLElement
const searchButtonDOM = document.getElementById('search-button') as HTMLElement
const nextButtonDOM =  document.getElementById('forward-button') as HTMLElement
const previousButtonDOM = document.getElementById('backward-button') as HTMLElement

class QueryHistoryStorage {
  private static STORAGE_KEY = 'query_history'
  private static SEPARATOR = ','
  private static MAX_COUNT = 10
  constructor(
    private getter: (key: string) => string | null,
    private setter: (key: string, value: string) => void
  ) { }
  set(query: string) {
    const Class = QueryHistoryStorage
    const current = this.getter(Class.STORAGE_KEY)?.split(Class.SEPARATOR) ?? []
    const updated = [query, ...current]
      .filter((value, index, self) => self.indexOf(value) === index)
      .slice(0, Class.MAX_COUNT)
    this.setter(Class.STORAGE_KEY, updated.join(Class.SEPARATOR))
  }
  getAll(): string[] {
    const Class = QueryHistoryStorage
    return this.getter(Class.STORAGE_KEY)?.split(Class.SEPARATOR) ?? []
  }
}

const queryHistoryStorage = new QueryHistoryStorage(
  (key) => localStorage.getItem(key),
  (key, value) => localStorage.setItem(key, value)
)

function sendSearchMessage(query: string) {
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

function sendNextResultMessage() {
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

function sendPreviousResultMessage() {
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

let previousQueryInPopup = ''

searchFormTextDOM.focus();

searchFormTextDOM.value = queryHistoryStorage.getAll()[0] || ''

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
        const text: string | undefined = response.text
        if (text) {
          searchFormTextDOM.value = text
        }
      }
    );
  }
});

nextButtonDOM.addEventListener('click', () => {
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
})

previousButtonDOM.addEventListener('click', () => {
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
})

searchButtonDOM.addEventListener('click', () => {
  const query = searchFormTextDOM.value
  if (query === previousQueryInPopup) {
    sendNextResultMessage()
  } else {
    sendSearchMessage(query)
  }
  previousQueryInPopup = query
  queryHistoryStorage.set(query)
})

addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    const query = searchFormTextDOM.value
    if (query === previousQueryInPopup && !event.shiftKey) {
      sendNextResultMessage()
    } else if (query === previousQueryInPopup && event.shiftKey) {
      sendPreviousResultMessage()
    } else {
      sendSearchMessage(query)
    }
    previousQueryInPopup = query
    queryHistoryStorage.set(query)
  }
})

addEventListener('unload', (_event) => {
  const background = chrome.extension.getBackgroundPage()

  if (!background) { return }
  background.chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0]
    if (!tab.id) { return }

    const message: ClearResult = {
      type: MessageType.ClearResult,
      payload: undefined
    }
    background.chrome.tabs.sendMessage(
      tab.id,
      message
    )
  })
}, true)

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (isChangeHighlight(request)) {
    searchResultTotalDOM.textContent = request.payload.total.toString()
    const current = request.payload.current
    searchResultCurrentDOM.textContent = current !== undefined ? (current + 1).toString() : '0'
  }
  sendResponse({})
  return true
})

chrome.tabs.onUpdated.addListener((_tabId, _changeInfo, tab) => {
  if (tab.status === 'complete') {
    previousQueryInPopup = ''
  }
})

chrome.tabs.executeScript({
  file: 'contentScript.js'
})
