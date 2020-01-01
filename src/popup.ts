'use strict';

import './popup.css';
import { Search, MessageType } from './message-type';

const searchFormDOM = document.getElementById('search-form')
const searchFormTextDOM = document.getElementById('search-form-text') as HTMLInputElement

searchFormDOM.addEventListener('submit', (e) => {
  e.preventDefault()

  const message: Search = {
    type: MessageType.Search,
    payload: {
      query: searchFormTextDOM.value
    }
  }

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];

    chrome.tabs.sendMessage(
      tab.id,
      message
    );
  });
})