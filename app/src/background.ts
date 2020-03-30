'use strict';

import { ClearResultMessage, MessageType } from "./message-type";

chrome.tabs.onActivated.addListener((activeInfo) => {
  const message: ClearResultMessage = {
    type: MessageType.ClearResult
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
    const message: ClearResultMessage = {
      type: MessageType.ClearResult
    }
    tab.id && chrome.tabs.sendMessage(
      tab.id,
      message
    )
  }
})
