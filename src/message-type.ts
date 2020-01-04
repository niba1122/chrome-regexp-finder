interface Message {
  type: MessageType,
  payload: unknown
}

export enum MessageType {
  Search = 'SEARCH',
  NextResult = 'NEXT_RESULT',
  PreviousResult = 'PREVIOUS_RESULT',
  ClearResult = 'CLEAR_RESULT',
  ChangeHighlight = 'CHANGE_HIGHLIGHT'
}

export interface Search extends Message {
  type: MessageType.Search,
  payload: {
    query: string
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
    total: number,
    current?: number
  }
}

export function isChangeHighlight(message: Message): message is ChangeHighlight {
  return message.type === MessageType.ChangeHighlight
}
