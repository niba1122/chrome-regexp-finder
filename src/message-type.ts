interface Message {
  type: MessageType,
  payload: unknown
}

export enum MessageType {
  Search = 'SEARCH',
  NextResult = 'NEXT_RESULT'
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
