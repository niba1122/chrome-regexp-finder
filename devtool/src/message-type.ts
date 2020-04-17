import { PageSearcher } from "@chrome-regexp-finder/core"

export enum MessageType {
  Search = 'SEARCH',
  NextResult = 'NEXT_RESULT',
  PreviousResult = 'PREVIOUS_RESULT',
  ClearResult = 'CLEAR_RESULT',
  ChangeHighlight = 'CHANGE_HIGHLIGHT',
  GetCursorSelection = 'GET_CURSOR_SELECTION',
  Searched = 'SEARCHED',
  Cleared = 'CLEARED',
  Error = 'ERROR'
}

export interface SearchMessage {
  type: MessageType.Search,
  payload: {
    query: string,
    flags: string
  }
}

export interface NextResultMessage {
  type: MessageType.NextResult,
}

export interface PreviousResultMessage {
  type: MessageType.PreviousResult,
}

export interface ClearResultMessage {
  type: MessageType.ClearResult,
}

export interface ChangeHighlightMessage {
  type: MessageType.ChangeHighlight,
  payload: {
    current: number
  }
}

export interface GetCursorSelectionMessage {
  type: MessageType.GetCursorSelection
}

export interface SearchedMessage {
  type: MessageType.Searched,
  payload: {
    total: number
  }
}

export interface ClearedMessage {
  type: MessageType.Cleared
}

export interface ErrorMessage {
  type: MessageType.Error
  payload: {
    error: PageSearcher.Error
  }
}

export type Message = SearchMessage
  | NextResultMessage
  | PreviousResultMessage
  | ClearResultMessage
  | ChangeHighlightMessage
  | GetCursorSelectionMessage
  | SearchedMessage
  | ClearedMessage
  | ErrorMessage

