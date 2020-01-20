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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('updated!!!!')
    chrome.tabs.executeScript(tabId, {
      file: 'contentScript.js'
    })
  }
})
