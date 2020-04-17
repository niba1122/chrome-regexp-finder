import App from './panel/App'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

ReactDOM.render(
  React.createElement(App),
  document.getElementById('app')
)

const backgroundPageConnection = chrome.runtime.connect({
  name: "panel"
})

backgroundPageConnection.postMessage({
  tabId: chrome.devtools.inspectedWindow.tabId,
})
