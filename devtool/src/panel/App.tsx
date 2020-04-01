import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { SearchMessage, MessageType, NextResultMessage, PreviousResultMessage } from "../message-type"

const App = () => {

  const [query, setQuery] = useState('')
  const [flags, setFlags] = useState('')

  const handleClickSearchButton = () => {
    const message: SearchMessage = {
      type: MessageType.Search,
      payload: {
        query,
        flags
      }
    }

    chrome.tabs.sendMessage(
      chrome.devtools.inspectedWindow.tabId,
      message
    )
  }

  const handleClickPreviousButton = () => {
    const message: PreviousResultMessage = {
      type: MessageType.PreviousResult
    }

    chrome.tabs.sendMessage(
      chrome.devtools.inspectedWindow.tabId,
      message
    )
  }

  const handleClickNextButton = () => {
    const message: NextResultMessage = {
      type: MessageType.NextResult
    }

    chrome.tabs.sendMessage(
      chrome.devtools.inspectedWindow.tabId,
      message
    )
  }


  return <div>
    <input type="text" value={query} onChange={(event) => setQuery(event.target.value)} />
    <input type="text" value={flags} onChange={(event) => setFlags(event.target.value)}/>
    <button onClick={handleClickSearchButton}>Search</button>
    <br />
    <button onClick={handleClickPreviousButton}>↑</button>
    <button onClick={handleClickNextButton}>↓</button>
    <br />
    <button onClick={() => location.reload()}>Reload</button>
  </div>
}
export default App
