interface Message {
  type: MessageType,
  payload: unknown
}

export enum MessageType {
  Search = 'SEARCH'
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
