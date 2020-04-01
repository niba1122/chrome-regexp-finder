'use strict';

import { ClearResultMessage, MessageType } from "./message-type";

const CONTENT_SCRIPT_PATH = 'contentScript.js'

function sendClearResultMessage(tabId: number) {
  const message: ClearResultMessage = {
    type: MessageType.ClearResult
  }
  chrome.tabs.sendMessage(
    tabId,
    message
  )
}

chrome.runtime.onConnect.addListener(function(devToolsConnection) {
  let tabId: number | null = null

  const devToolsMessageListener = (message: any) => {
    chrome.tabs.executeScript(message.tabId, {
      file: CONTENT_SCRIPT_PATH
    })
    tabId = message.tabId
  }

  const tabUpdatedListener = (_tabId: number, _changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
    if (tab.id === tabId && tab.status === 'complete') {
      chrome.tabs.executeScript({
        file: CONTENT_SCRIPT_PATH
      })
      sendClearResultMessage(tab.id)
    }
  }

  devToolsConnection.onMessage.addListener(devToolsMessageListener);
  chrome.tabs.onUpdated.addListener(tabUpdatedListener)

  devToolsConnection.onDisconnect.addListener(() => {
    devToolsConnection.onMessage.removeListener(devToolsMessageListener);
    chrome.tabs.onUpdated.removeListener(tabUpdatedListener)
    tabId && sendClearResultMessage(tabId)
  })
})
