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
