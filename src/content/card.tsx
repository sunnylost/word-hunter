import './index.less'
import cardStyles from './card.less'
import dictStyles from './dict.less'

import { createSignal, Show, For, batch, onMount } from 'solid-js'
import { customElement } from 'solid-element'
import { classes, Messages } from '../constant'
import {
  init as highlightInit,
  markAsKnown,
  isInDict,
  getMessagePort,
  isWordKnownAble,
  zenExcludeWords,
  setZenExcludeWords
} from './highlight'
import { Dict, getWordByHref } from './dict'

let timerShowRef: number
let timerHideRef: number
let inDirecting = false
let rect: DOMRect

const [curWord, setCurWord] = createSignal('')
const [dictHistory, setDictHistory] = createSignal<string[]>([])
const [zenMode, setZenMode] = createSignal(false)
const [zenModeWords, setZenModeWords] = createSignal<string[]>([])

customElement('wh-card', () => {
  onMount(() => {
    highlightInit()
    bindEvents()
  })

  const onKnown = (e: MouseEvent) => {
    e.preventDefault()
    const word = curWord()
    markAsKnown(word)
    setCurWord('')
    hidePopupDelay(0)
  }

  const onCardClick = (e: MouseEvent) => {
    const node = e.target as HTMLElement
    const audioSrc = node.getAttribute('data-src-mp3') || node.parentElement?.getAttribute('data-src-mp3')
    if (audioSrc) {
      e.stopImmediatePropagation()
      getMessagePort().postMessage({ action: Messages.play_audio, audio: audioSrc })
      return false
    }

    if (node.tagName === 'A' && node.dataset.href) {
      e.stopImmediatePropagation()
      const word = getWordByHref(node.dataset.href)
      if (word === curWord()) return false

      inDirecting = true
      setCurWord(word)
      setDictHistory([...dictHistory(), word])
      return false
    }

    if (node.classList.contains('__btn-back') || node.parentElement?.classList.contains('__btn-back')) {
      e.stopImmediatePropagation()
      inDirecting = true
      const newHistory = dictHistory().slice(0, -1)
      setDictHistory(newHistory)
      const prevWord = newHistory.at(-1)
      if (prevWord) {
        setCurWord(prevWord)
      }
    }
  }

  const onCardDoubleClick = (e: MouseEvent) => {
    const selection = document.getSelection()
    const word = selection?.toString().trim().toLowerCase()
    if (word && isInDict(word)) {
      setCurWord(word)
      setDictHistory([...dictHistory(), word])
    }
  }

  const onDictSettle = () => {
    adjustCardPosition(rect, inDirecting)
    inDirecting = false
  }

  return (
    <div class="__word_card" onclick={onCardClick} onmouseleave={hidePopup} ondblclick={onCardDoubleClick}>
      <div class="__buttons_container">
        <button data-class={classes.known} disabled={!isWordKnownAble(curWord())} onclick={onKnown}>
          😀 known
        </button>
        <span>
          <a target="_blank" href={`https://www.collinsdictionary.com/dictionary/english/${curWord()}`}>
            {curWord()}
          </a>
        </span>
        <a classList={{ '__btn-back': true, disabled: dictHistory().length < 2 }} title="back">
          <i class="i-history-back"></i>
        </a>
      </div>
      <Show when={curWord()}>
        <Dict word={curWord()} onSettle={onDictSettle} />
      </Show>
      <style>{cardStyles}</style>
      <style>{dictStyles}</style>
    </div>
  )
})

export function ZenMode() {
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && zenMode()) {
      toggleZenMode()
    }
  })

  const onWordClick = (e: MouseEvent) => {
    const node = e.target as HTMLElement
    if (e.metaKey || e.ctrlKey) {
      if (zenExcludeWords().includes(getNodeWord(node))) {
        setZenExcludeWords(zenExcludeWords().filter(w => w !== curWord()))
      } else {
        setZenExcludeWords([...zenExcludeWords(), getNodeWord(node)])
      }
    }
  }

  return (
    <Show when={zenMode()}>
      <div class={classes.zen_mode}>
        <pre>
          <p>
            Note: use <kbd>⌘</kbd> + <kbd>Click</kbd> to unselect word
          </p>
        </pre>
        <div>
          <For each={zenModeWords()}>
            {(word: string) => {
              return (
                <span classList={{ [classes.excluded]: zenExcludeWords().includes(word) }} onclick={onWordClick}>
                  {word}
                </span>
              )
            }}
          </For>
        </div>
      </div>
    </Show>
  )
}

function getCardNode() {
  const root = document.querySelector('wh-card')?.shadowRoot
  return root?.querySelector('.' + classes.card) as HTMLElement
}

function getNodeWord(node: HTMLElement | Node | undefined) {
  if (!node) return ''
  return (node.textContent ?? '').toLowerCase()
}

function hidePopupDelay(ms: number) {
  clearTimerHideRef()
  const cardNode = getCardNode()
  timerHideRef = window.setTimeout(() => {
    cardNode.classList.remove('__card_visible')
    cardNode.classList.add('__card_hidden')
    setDictHistory([])
  }, ms)
}

function clearTimerHideRef() {
  timerHideRef && clearTimeout(timerHideRef)
}

function toggleZenMode() {
  if (!zenMode()) {
    const words = Array.from(document.querySelectorAll('.' + classes.unknown)).map(node => getNodeWord(node))
    batch(() => {
      setZenModeWords([...new Set(words)])
      setZenExcludeWords([])
    })
  }
  setZenMode(!zenMode())
}

// this function expose to be called in popup page
window.__toggleZenMode = toggleZenMode

function hidePopup(e: Event) {
  const node = e.target as HTMLElement
  timerShowRef && clearTimeout(timerShowRef)
  if (node.classList.contains(classes.mark) || node.classList.contains(classes.card)) {
    hidePopupDelay(500)
  }

  if (node.classList.contains(classes.mark)) {
    node.removeEventListener('mouseleave', hidePopup)
  }
}

function showPopup() {
  const cardNode = getCardNode()
  cardNode.classList.remove('__card_hidden')
  cardNode.classList.add('__card_visible')
}

function adjustCardPosition(rect: DOMRect, onlyOutsideViewport = false) {
  const cardNode = getCardNode()
  const { x: x, y: y, width: m_width, height: m_height } = rect
  const { x: c_x, y: c_y, width: c_width, height: c_height } = cardNode.getBoundingClientRect()

  let left = x + m_width + 10
  let top = y - 20
  // if overflow right viewport
  if (left + c_width > window.innerWidth) {
    if (x > c_width) {
      left = x - c_width - 5
    } else {
      left = window.innerWidth - c_width - 30
      top = y + m_height + 10
    }
  }
  // if overflow top viewport
  if (top < 0) {
    top = 10
  }

  if (top + c_height > window.innerHeight) {
    top = window.innerHeight - c_height - 10
  }

  if (!onlyOutsideViewport || c_y < 0 || c_y + c_height > window.innerHeight) {
    cardNode.style.top = `${top}px`
  }

  if (!onlyOutsideViewport || c_x < 0 || c_x + c_width > window.innerWidth) {
    cardNode.style.left = `${left}px`
  }
}

function bindEvents() {
  document.addEventListener('mouseover', async (e: MouseEvent) => {
    const node = e.target as HTMLElement

    if (node.classList.contains('__mark')) {
      // skip when redirecting in card dictnary
      if (inDirecting) {
        inDirecting = true
        return false
      }

      rect = node.getBoundingClientRect()
      const word = getNodeWord(node)
      setCurWord(word)
      adjustCardPosition(rect)
      setDictHistory([word])

      timerShowRef && clearTimeout(timerShowRef)
      timerShowRef = window.setTimeout(() => {
        showPopup()
      }, 200)

      clearTimerHideRef()
      node.addEventListener('mouseleave', hidePopup)
    }

    if (node.shadowRoot === document.querySelector('wh-card')?.shadowRoot) {
      clearTimerHideRef()
    }
  })
}