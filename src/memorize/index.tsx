/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import { App } from './app'
import { StoreProvider } from './wordsProvider'

render(
  () => (
    <StoreProvider>
      <App />
    </StoreProvider>
  ),
  document.getElementById('app') ?? document.body
)
