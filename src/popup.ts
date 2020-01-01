'use strict';

import './popup.css';
import { Search, MessageType, NextResult } from './message-type';

const searchFormDOM = document.getElementById('search-form')
const searchFormTextDOM = document.getElementById('search-form-text') as HTMLInputElement

let previousQuery = ''

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

      chrome.tabs.sendMessage(
        tab.id,
        message
      );
    });
  } else {
    const message: Search = {
      type: MessageType.Search,
      payload: {
        query
      }
    }

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs[0];

      chrome.tabs.sendMessage(
        tab.id,
        message
      );
    });
  }
  previousQuery = query
})