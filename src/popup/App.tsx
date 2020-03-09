import * as React from "react"
import { useEffect, useState, useRef, useMemo } from "react";
import { sendGetCursorSelectionMessage, sendNextResultMessage, sendPreviousResultMessage, sendSearchMessage, subscribeChangeHighlightMessage, subscribeSearchedMessage, subscribeClearedMessage } from "./message-service";
import QueryHistoryStorage from "./query-history-storage";

const App: React.FC = () => {
  const [total, setTotal] = useState(0)

  const [current, setCurrent] = useState<number | undefined>()

  const [query, setQuery] = useState('')
  const queryRef = useValueRef(query)

  const [previousQueryInPopup, setPreviousQueryInPopup] = useState('')
  const previousQueryInPopupRef = useValueRef(previousQueryInPopup)

  const searchFormTextDOMRef = useRef<HTMLInputElement>(null)

  const queryHistoryStorage = useMemo(() => {
    return new QueryHistoryStorage(
      (key) => localStorage.getItem(key),
      (key, value) => localStorage.setItem(key, value)
    )
  }, [])

  const handleChangeSearchText: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setQuery(event.target.value)
  }

  const handleClickSearchButton = () => {
    if (query === previousQueryInPopup) {
      sendNextResultMessage()
    } else {
      sendSearchMessage(query)
    }
    setPreviousQueryInPopup(query)
  }

  const handleClickNextButton = () => {
    sendNextResultMessage()
  }

  const handleClickPreviousButton = () => {
    sendPreviousResultMessage()
  }

  useEffect(() => {
    const searchFormTextDOM = searchFormTextDOMRef.current
    if (searchFormTextDOM) {
      searchFormTextDOM.focus()

      window.requestAnimationFrame(() => {
        searchFormTextDOM.select()
      })
    }

    const previousQuery = queryHistoryStorage.getAll()[0]
    previousQuery && setQuery(previousQuery)

    sendGetCursorSelectionMessage((text) => {
      if (text) {
        setQuery(text)
      }
    })

    addEventListener('keydown', (event) => {
      const query = queryRef.current
      const previousQueryInPopup = previousQueryInPopupRef.current
      if (event.key === 'Enter') {
        if (query === previousQueryInPopup && !event.shiftKey) {
          sendNextResultMessage()
        } else if (query === previousQueryInPopup && event.shiftKey) {
          sendPreviousResultMessage()
        } else {
          sendSearchMessage(query)
        }
        setPreviousQueryInPopup(query)
      }
    })

    subscribeSearchedMessage((request) => {
      const query = queryRef.current
      const total = request.payload.total
      setTotal(total)
      if (total > 0) {
        setCurrent(0)
        queryHistoryStorage.set(query)
      } else {
        setCurrent(undefined)
      }
    })

    subscribeChangeHighlightMessage((request) => {
      setCurrent(request.payload.current)
    })

    subscribeClearedMessage(() => {
      setTotal(0)
      setCurrent(undefined)
    })

    chrome.tabs.onUpdated.addListener((_tabId, _changeInfo, tab) => {
      if (tab.status === 'complete') {
        setPreviousQueryInPopup('')
      }
    })
  }, [])

  return (
    <div className="search-form">
      <div className="search-form__text">
        <span className="query-text">
          <input className="query-text__input" type="text" value={query} onChange={handleChangeSearchText} placeholder="[a-z]+.*\w" ref={searchFormTextDOMRef} />
        </span>
      </div>
      <div className="search-form__count">
        <span>{current !== undefined ? (current + 1) : '0'}</span>
        &nbsp;/&nbsp;
        <span>{total}</span>
      </div>
      <div className="search-form__search-button">
        <span className="button" onClick={handleClickSearchButton}>
          <img className="button__image" src="images/search.svg" alt="search" />
        </span>
      </div>
      <div className="search-form__backward-button" onClick={handleClickPreviousButton}>
        <span className="button">
          <img className="button__image" src="images/backward.svg" alt="backward" />
        </span>
      </div>
      <div className="search-form__forward-button" onClick={handleClickNextButton}>
        <span className="button">
          <img className="button__image" src="images/forward.svg" alt="forward" />
        </span>
      </div>
    </div>
  )
}

function useValueRef<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

export default App
