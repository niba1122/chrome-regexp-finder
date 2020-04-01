import * as React from "react"
import { useState, useEffect, useRef } from "react"
import SearchCondition, { searchConditionsAreEqual } from "./SearchCondition"
import { getMessageService } from "../messageService"

const INITIAL_REGEXP_FLAGS = 'gi'

function useValueRef<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

const messageService = getMessageService(async () => chrome.devtools.inspectedWindow.tabId)

const App = () => {
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState<number | undefined>()

  const [searchCondition, setSearchCondition] = useState<SearchCondition>({
    query: '',
    flags: INITIAL_REGEXP_FLAGS
  })
  const searchConditionRef = useValueRef(searchCondition)

  const [previousSearchCondition, setPreviousSearchCondition] = useState<SearchCondition | null>(null)
  const previousSearchConditionRef = useValueRef(previousSearchCondition)

  const handleClickSearchButton = () => {
    if (
      previousSearchCondition
      && searchConditionsAreEqual(previousSearchCondition, searchCondition)
    ) {
      messageService.sendNextResultMessage()
    } else {
      messageService.sendSearchMessage(searchCondition.query, searchCondition.flags)
    }
    setPreviousSearchCondition(searchCondition)
  }

  const handleChangeSearchText: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const query = event.target.value
    setSearchCondition((state) => ({...state, query }))
  }

  const handleChangeFlags: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const flags = event.target.value
    setSearchCondition((state) => ({...state, flags }))
  }

  const handleClickPreviousButton = () => {
    messageService.sendPreviousResultMessage()
  }

  const handleClickNextButton = () => {
    messageService.sendNextResultMessage()
  }

  const handleClearButton = () => {
    setPreviousSearchCondition(null)
    messageService.sendClearResultMessage()
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const searchCondition = searchConditionRef.current
      const previousSearchCondition = previousSearchConditionRef.current
      if (event.key === 'Enter') {
        if (
          previousSearchCondition
          && searchConditionsAreEqual(previousSearchCondition, searchCondition)
          && !event.shiftKey
        ) {
          messageService.sendNextResultMessage()
        } else if (
          previousSearchCondition
          && searchConditionsAreEqual(previousSearchCondition, searchCondition)
          && event.shiftKey
        ) {
          messageService.sendPreviousResultMessage()
        } else {
          messageService.sendSearchMessage(searchCondition.query, searchCondition.flags)
        }
        setPreviousSearchCondition(searchCondition)
      }
    }
    addEventListener('keydown', handleKeyDown)

    messageService.subscribeSearchedMessage((request) => {
      const total = request.payload.total
      setTotal(total)
      if (total > 0) {
        setCurrent(0)
      } else {
        setCurrent(undefined)
      }
    })

    messageService.subscribeChangeHighlightMessage((request) => {
      setCurrent(request.payload.current)
    })

    messageService.subscribeClearedMessage(() => {
      setTotal(0)
      setCurrent(undefined)
    })

    return () => {
      removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return <div>
    <h1>Regexp Finder Devtool</h1>
    <input type="text" value={searchCondition.query} onChange={handleChangeSearchText} />
    <input type="text" value={searchCondition.flags} onChange={handleChangeFlags}/>
    {current !== undefined ? current + 1 : 0}&nbsp;/&nbsp;{total}
    <button onClick={handleClickSearchButton}>Search</button>
    <button onClick={handleClearButton}>Clear</button>
    <br />
    <button onClick={handleClickPreviousButton}>↑</button>
    <button onClick={handleClickNextButton}>↓</button>
    <br />
    <button onClick={() => location.reload()}>Reload</button>
  </div>
}
export default App
