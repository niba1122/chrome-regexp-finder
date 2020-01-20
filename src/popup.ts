'use strict';

import './popup.css';
import { Search, MessageType, NextResult, ClearResult, isChangeHighlight, PreviousResult } from './message-type';

const searchFormTextDOM = document.getElementById('search-form-text') as HTMLInputElement
const searchResultTotalDOM = document.getElementById('search-result-total') as HTMLElement
const searchResultCurrentDOM = document.getElementById('search-result-current') as HTMLElement
const searchButtonDOM = document.getElementById('search-button') as HTMLElement
const nextButtonDOM =  document.getElementById('forward-button') as HTMLElement
const previousButtonDOM = document.getElementById('backward-button') as HTMLElement

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

let previousQuery = ''

searchFormTextDOM.focus()

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
  if (query === previousQuery) {
    sendNextResultMessage()
  } else {
    sendSearchMessage(query)
  }
  previousQuery = query
})

addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    const query = searchFormTextDOM.value
    if (query === previousQuery && !event.shiftKey) {
      sendNextResultMessage()
    } else if (query === previousQuery && event.shiftKey) {
      sendPreviousResultMessage()
    } else {
      sendSearchMessage(query)
    }
    previousQuery = query
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

chrome.tabs.executeScript({
  file: 'contentScript.js'
})
