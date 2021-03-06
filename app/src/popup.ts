'use strict';

// To output css, import is required
import './popup.css'

import { MessageType, ClearResultMessage } from './message-type';
import * as ReactDOM from 'react-dom';
import App from './popup/App';
import * as React from 'react';

ReactDOM.render(
  React.createElement(App),
  document.getElementById("app")
)

addEventListener('unload', (_event) => {
  const background = chrome.extension.getBackgroundPage()

  if (!background) { return }
  background.chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0]
    if (!tab.id) { return }

    const message: ClearResultMessage = {
      type: MessageType.ClearResult
    }
    background.chrome.tabs.sendMessage(
      tab.id,
      message
    )
  })
}, true)

chrome.tabs.executeScript({
  file: 'contentScript.js'
})
