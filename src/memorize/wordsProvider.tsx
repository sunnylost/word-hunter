import { createContext, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { getLocalValue } from '../lib'
import { StorageKey } from '../constant'
import { PAGE_CONFIG, type StoreContextType, type State } from './util'

const StoreContext = createContext<StoreContextType>()
const CachedKey = 'memorize-state'

export const StoreProvider = (props: any) => {
  const [state, setState] = createStore<State>({
    page: PAGE_CONFIG,
    wordCount: 5,
    currentQuestion: 0
  })

  const loadState = () => {
    let cachedState
    try {
      cachedState = JSON.parse(localStorage.getItem(CachedKey) ?? '{}')
    } catch {
      cachedState = {}
    }

    Object.keys(cachedState).forEach(key => {
      setState(key as keyof State, cachedState[key])
    })
  }

  const saveState = () => {
    localStorage.setItem(CachedKey, JSON.stringify(state))
  }

  getLocalValue(StorageKey.context).then(contexts => {
    console.log('contexts', contexts)
  })

  const store: StoreContextType = [
    state,
    {
      setPage: page => {
        setState('page', page)
        saveState()
      },
      setWordCount: count => {
        setState('wordCount', count)
        saveState()
      },
      setCurrentQuestion: question => {
        setState('currentQuestion', question)
        saveState()
      },
      loadState
    }
  ]

  return <StoreContext.Provider value={store}>{props.children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)
