'use strict';

import './popup.css';
import { Search, MessageType, NextResult, ClearResult, isChangeHighlight } from './message-type';

const searchFormDOM = document.getElementById('search-form') as HTMLFormElement
const searchFormTextDOM = document.getElementById('search-form-text') as HTMLInputElement
const searchResultTotalDOM = document.getElementById('search-result-total') as HTMLElement
const searchResultCurrentDOM = document.getElementById('search-result-current') as HTMLElement

let previousQuery = ''

searchFormTextDOM.focus()

searchFormDOM.addEventListener('submit', (e) => {
  e.preventDefault()
  const query = searchFormTextDOM.value

  if (query === previousQuery) {
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
  } else {
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
  previousQuery = query
})

addEventListener('unload', (_event) => {
  const background = chrome.extension.getBackgroundPage()

  const message: ClearResult = {
    type: MessageType.ClearResult,
    payload: undefined
  }

  if (!background) { return }
  background.chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0]
    if (!tab.id) { return }
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
