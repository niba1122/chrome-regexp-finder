import { PageSearcher } from "./core/page-searcher"

interface Message {
  type: MessageType,
  payload: unknown
}

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

export interface Search extends Message {
  type: MessageType.Search,
  payload: {
    query: string,
    flags: string
  }
}

export function isSearch(message: Message): message is Search {
  return message.type === MessageType.Search
}

export interface NextResult extends Message {
  type: MessageType.NextResult,
}

export function isNextResult(message: Message): message is NextResult {
  return message.type === MessageType.NextResult
}

export interface PreviousResult extends Message {
  type: MessageType.PreviousResult,
}

export function isPreviousResult(message: Message): message is NextResult {
  return message.type === MessageType.PreviousResult
}

export interface ClearResult extends Message {
  type: MessageType.ClearResult,
}

export function isClearResult(message: Message): message is ClearResult {
  return message.type === MessageType.ClearResult
}

export interface ChangeHighlight extends Message {
  type: MessageType.ChangeHighlight,
  payload: {
    current: number
  }
}

export function isChangeHighlight(message: Message): message is ChangeHighlight {
  return message.type === MessageType.ChangeHighlight
}

export interface GetCursorSelection extends Message {
  type: MessageType.GetCursorSelection
}

export function isGetCursorSelection(message: Message): message is GetCursorSelection {
  return message.type === MessageType.GetCursorSelection
}

export interface Searched extends Message {
  type: MessageType.Searched,
  payload: {
    total: number
  }
}

export function isSearched(message: Message): message is Searched {
  return message.type === MessageType.Searched
}

export interface Cleared extends Message {
  type: MessageType.Cleared
}

export function isCleared(message: Message): message is Cleared {
  return message.type === MessageType.Cleared
}

export interface MessageError extends Message {
  type: MessageType.Error
  payload: {
    error: PageSearcher.Error
  }
}

export function isError(message: Message): message is MessageError {
  return message.type === MessageType.Error
}
