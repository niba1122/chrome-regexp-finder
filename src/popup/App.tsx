import * as React from "react"
import { useEffect, useState, useRef, useMemo } from "react";
import { sendGetCursorSelectionMessage, sendNextResultMessage, sendPreviousResultMessage, sendSearchMessage, subscribeChangeHighlightMessage, subscribeSearchedMessage, subscribeClearedMessage, subscribeErrorMessage } from "./message-service";
import SearchConditionHistoryStorage from "./query-history-storage";
import SearchCondition, { searchConditionsAreEqual } from "./search-condition";

const INITIAL_REGEXP_FLAGS = 'gi'

const App: React.FC = () => {
  const [total, setTotal] = useState(0)

  const [current, setCurrent] = useState<number | undefined>()

  const [searchCondition, setSearchCondition] = useState<SearchCondition>({
    query: '',
    flags: INITIAL_REGEXP_FLAGS
  })
  const searchConditionRef = useValueRef(searchCondition)

  const [previousSearchCondition, setPreviousSearchCondition] = useState<SearchCondition | null>(null)
  const previousSearchConditionRef = useValueRef(previousSearchCondition)

  const flagsAreValid = useMemo(() => {
    try {
      new RegExp('', searchCondition.flags)
      return true
    } catch {
      return false
    }
  }, [searchCondition.flags])

  const searchFormTextDOMRef = useRef<HTMLInputElement>(null)

  const queryHistoryStorage = useMemo(() => {
    return new SearchConditionHistoryStorage(
      (key) => localStorage.getItem(key),
      (key, value) => localStorage.setItem(key, value)
    )
  }, [])

  const handleChangeSearchText: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const query = event.target.value
    setSearchCondition((state) => ({...state, query }))
  }

  const handleChangeFlags: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const flags = event.target.value
    setSearchCondition((state) => ({...state, flags }))
  }

  const handleClickSearchButton = () => {
    if (
      previousSearchCondition
      && searchConditionsAreEqual(previousSearchCondition, searchCondition)
    ) {
      sendNextResultMessage()
    } else {
      sendSearchMessage(searchCondition.query, searchCondition.flags)
    }
    setPreviousSearchCondition(searchCondition)
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

    const savedSearchCondition = queryHistoryStorage.getAll()[0]
    if (savedSearchCondition) {
      setSearchCondition(savedSearchCondition)
    }

    sendGetCursorSelectionMessage((text) => {
      if (text) {
        setSearchCondition({
          query: text,
          flags: INITIAL_REGEXP_FLAGS
        })
      }
    })

    addEventListener('keydown', (event) => {
      const searchCondition = searchConditionRef.current
      const previousSearchCondition = previousSearchConditionRef.current
      if (event.key === 'Enter') {
        if (
          previousSearchCondition
          && searchConditionsAreEqual(previousSearchCondition, searchCondition)
          && !event.shiftKey
        ) {
          sendNextResultMessage()
        } else if (
          previousSearchCondition
          && searchConditionsAreEqual(previousSearchCondition, searchCondition)
          && event.shiftKey
        ) {
          sendPreviousResultMessage()
        } else {
          sendSearchMessage(searchCondition.query, searchCondition.flags)
        }
        setPreviousSearchCondition(searchCondition)
      }
    })

    subscribeSearchedMessage((request) => {
      const searchCondition = searchConditionRef.current
      const total = request.payload.total
      setTotal(total)
      if (total > 0) {
        setCurrent(0)
        queryHistoryStorage.set(searchCondition)
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

    // subscribeErrorMessage((request) => {
    //   const error = request.payload.error
    //   if (error.type === PageSearcher.ErrorType.InvalidFlags) {
    //     console.error('Invalid flag')
    //   }
    // })

    chrome.tabs.onUpdated.addListener((_tabId, _changeInfo, tab) => {
      if (tab.status === 'complete') {
        setPreviousSearchCondition(null)
      }
    })
  }, [])

  return (
    <div className="search-form">
      <div className="search-form__text">
        <span className="query-text">
          <span className="query-text__slash">/</span>
          <input
            className="query-text__query"
            type="text"
            value={searchCondition.query}
            onChange={handleChangeSearchText}
            placeholder="[a-z]+.*\w"
            ref={searchFormTextDOMRef}
          />
          <span className="query-text__slash">/</span>
          <input
            className={`query-text__flags${ flagsAreValid ? '' : ' query-text__flags--invalid' }`}
            type="text"
            value={searchCondition.flags}
            onChange={handleChangeFlags}
            placeholder={INITIAL_REGEXP_FLAGS}
          />
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
