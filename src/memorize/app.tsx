import { onMount } from 'solid-js'
import { Config } from './components/config'
import { Practice } from './components/practice'
import { useStore } from './wordsProvider'

export const App = () => {
  const [state, { loadState }] = useStore()!

  onMount(() => {
    loadState()
  })

  return (
    <div class="h-screen flex items-center justify-center bg-gray-100 p-4">
      {state.page === 1 ? <Config></Config> : <Practice></Practice>}
    </div>
  )
}
