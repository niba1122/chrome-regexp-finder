'use strict';

import { getMessageService } from "./messageService";

const CONTENT_SCRIPT_PATH = 'contentScript.js'

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'REQUEST_CORE_RUNTIME') {
    fetch('./core.js')
      .then((response) => {
        return response.text()
      })
      .then((result) => {
        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab?.id, {
            type: 'RESPONSE_CORE_RUNTIME',
            code: result
          })
        }
      })
  }
  return true
})

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
      const messageService = getMessageService(async () => tab.id)
      messageService.sendClearResultMessage()
    }
  }

  devToolsConnection.onMessage.addListener(devToolsMessageListener);
  chrome.tabs.onUpdated.addListener(tabUpdatedListener)

  devToolsConnection.onDisconnect.addListener(() => {
    devToolsConnection.onMessage.removeListener(devToolsMessageListener);
    chrome.tabs.onUpdated.removeListener(tabUpdatedListener)
    const messageService = getMessageService(async () => tabId)
    messageService.sendClearResultMessage()
  })
})
