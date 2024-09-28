import { useStore } from '../wordsProvider'

export function Config() {
  const [state, { setPage, setWordCount }] = useStore()!

  const startPractice = () => {
    setPage(2)
  }

  return (
    <div class="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
      <h1 class="text-2xl font-bold mb-4">Welcome to Vocabulary Practice</h1>
      <label for="word-count" class="block mb-2 text-sm font-medium text-gray-700">
        Select number of words to practice:
      </label>
      <select
        id="word-count"
        class="block w-full p-2 border border-gray-300 rounded-lg"
        value={state.wordCount}
        onInput={e => setWordCount(+e.target.value)}
      >
        <option value={5}>5 words</option>
        <option value={10}>10 words</option>
        <option value={15}>15 words</option>
        <option value={20}>20 words</option>
        <option value={25}>25 words</option>
        <option value={30}>30 words</option>
      </select>
      <button onClick={startPractice} class="mt-4 w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600">
        Start Practice
      </button>
    </div>
  )
}
