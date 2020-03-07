interface Store<HG, H> {
  setSearchResult(highlightGroups: HG[], highlights: H[]): void
  clear(): void
  isCleared(): boolean
  forwardSelectedHighlight(): void
  backwardSelectedHighlight(): void
  getSelectedHighlight(): H
  onClear(listener: Store.ClearListener<HG>): void
  onChangeHighlightSelection(listener: Store.ChangeHighlightSelectionListener<H>): void
}

namespace Store {
  export type ClearListener<HG> = (highlightGroups: HG[]) => void
  export type ChangeHighlightSelectionListener<H> = (args: {
    previousHighlight?: H,
    nextHighlight?: H,
    total: number,
    nextIndex?: number
  }) => void
}

export function createStore<HG, H>(): Store<HG, H> {
  let highlightGroups: HG[] = []
  let highlights: H[] = []
  let selectedHighlightIndex = 0

  let clearListener: Store.ClearListener<HG> | null = null
  let changeHighlightSelectionListener: Store.ChangeHighlightSelectionListener<H> | null = null

  function setSearchResult(hg: HG[], h: H[]) {
    highlightGroups = hg
    highlights = h
    selectedHighlightIndex = 0
    if (changeHighlightSelectionListener) {
      changeHighlightSelectionListener({
        nextHighlight: highlights[selectedHighlightIndex],
        total: highlights.length,
        nextIndex: highlights.length > 0 ? selectedHighlightIndex : undefined
      })
    }
  }

  function clear() {
    if (clearListener) {
      clearListener(highlightGroups)
    }
    const previousHighlight = highlights[selectedHighlightIndex]
    highlightGroups = []
    highlights = []
    selectedHighlightIndex = 0
    if (changeHighlightSelectionListener) {
      changeHighlightSelectionListener({
        previousHighlight: previousHighlight,
        total: highlights.length,
      })
    }
  }

  function isCleared(): boolean {
    return highlightGroups.length === 0 && highlights.length === 0 && selectedHighlightIndex === 0
  }

  function forwardSelectedHighlight() {
    if (!highlights.length) { return }
    const previousHighlight = highlights[selectedHighlightIndex]
    selectedHighlightIndex++
    if (highlights.length === selectedHighlightIndex) {
      selectedHighlightIndex = 0
    }
    if (changeHighlightSelectionListener) {
      changeHighlightSelectionListener({
        previousHighlight: previousHighlight,
        nextHighlight: highlights[selectedHighlightIndex],
        total: highlights.length,
        nextIndex: selectedHighlightIndex
      })
    }
  }

  function backwardSelectedHighlight() {
    if (!highlights.length) { return }
    const previousHighlight = highlights[selectedHighlightIndex]
    if (selectedHighlightIndex === 0) {
      selectedHighlightIndex = highlights.length
    }
    selectedHighlightIndex--
    if (changeHighlightSelectionListener) {
      changeHighlightSelectionListener({
        previousHighlight: previousHighlight,
        nextHighlight: highlights[selectedHighlightIndex],
        total: highlights.length,
        nextIndex: selectedHighlightIndex
      })
    }
  }

  function getSelectedHighlight(): H {
    return highlights[selectedHighlightIndex]
  }

  function onClear(listener: Store.ClearListener<HG>) {
    clearListener = listener
  }

  function onChangeHighlightSelection(listener: Store.ChangeHighlightSelectionListener<H>) {
    changeHighlightSelectionListener = listener
  }

  return {
    setSearchResult,
    clear,
    isCleared,
    forwardSelectedHighlight,
    backwardSelectedHighlight,
    getSelectedHighlight,
    onClear,
    onChangeHighlightSelection
  }
}
