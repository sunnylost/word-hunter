export const PAGE_CONFIG = 1
export const PAGE_PRACTICE = 2

export type State = {
  page: typeof PAGE_CONFIG | typeof PAGE_PRACTICE // 1: config, 2: practice
  wordCount: number // 选择的练习单词数
  currentQuestion: number
}

export type StoreActions = {
  setPage: (page: number) => void
  setWordCount: (count: number) => void
  setCurrentQuestion: (question: number) => void
  loadState: () => void
}

export type StoreContextType = [State, StoreActions]

export type Question = {
  sentence: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export const KNOWN = 0
export const UNKNOWN = 1
export const FUZZY = 2

export type WordState = typeof KNOWN | typeof UNKNOWN | typeof FUZZY
