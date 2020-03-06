'use strict';

import { ClearResult, MessageType } from "./message-type";

chrome.tabs.onActivated.addListener((activeInfo) => {
  const message: ClearResult = {
    type: MessageType.ClearResult,
    payload: undefined
  }
  chrome.tabs.sendMessage(
    activeInfo.tabId,
    message
  )
})

chrome.tabs.onUpdated.addListener((_tabId, _changeInfo, tab) => {
  if (tab.status === 'complete') {
    chrome.tabs.executeScript({
      file: 'contentScript.js'
    })
    const message: ClearResult = {
      type: MessageType.ClearResult,
      payload: undefined
    }
    tab.id && chrome.tabs.sendMessage(
      tab.id,
      message
    )
  }
})
