import { useState, useEffect } from 'react'
import { getItemEmoji, getEmojiImageUrl } from '../lib/constants'

const STRIP_WORDS = /\b(ground|whole|dried|fresh|organic|raw|pure|extra virgin|virgin|light|dark|reduced|roasted|toasted|powdered|minced|chopped|sliced|diced|smoked|crushed|flaked|freeze[- ]dried|instant|fortified|unsweetened|sweetened|salted|unsalted)\b/gi

function clean(name) {
  return name.replace(STRIP_WORDS, '').replace(/\s+/g, ' ').trim()
}

function hyphen(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-')
}

function title(s) {
  return s.trim().replace(/\b\w/g, c => c.toUpperCase())
}

function firstWord(s) {
  return s.trim().split(/\s+/)[0]
}

function unique(arr) {
  return [...new Map(arr.map(u => [u, u])).values()]
}

function getSources(name, emoji) {
  const cleaned = clean(name)
  const fw = firstWord(name)
  const fwCleaned = firstWord(cleaned)

  return unique([
    // Spoonacular — photorealistic JPGs
    `https://spoonacular.com/cdn/ingredients_100x100/${hyphen(name)}.jpg`,
    `https://spoonacular.com/cdn/ingredients_100x100/${hyphen(cleaned)}.jpg`,
    `https://spoonacular.com/cdn/ingredients_100x100/${hyphen(fw)}.jpg`,
    `https://spoonacular.com/cdn/ingredients_100x100/${hyphen(fwCleaned)}.jpg`,
    // TheMealDB — illustrated PNGs, transparent bg
    `https://www.themealdb.com/images/ingredients/${title(name)}.png`,
    `https://www.themealdb.com/images/ingredients/${title(cleaned)}.png`,
    `https://www.themealdb.com/images/ingredients/${title(fw)}.png`,
    // Noto Emoji SVG — always works
    getEmojiImageUrl(emoji),
  ])
}

export default function ItemEmoji({ name, category, subcategory, size = 'md' }) {
  const emoji = getItemEmoji(name, category, subcategory)
  const sources = getSources(name, emoji)

  const [idx, setIdx] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => { setIdx(0); setFailed(false) }, [name])

  const sizeClass = size === 'sm'
    ? 'w-8 h-8 text-base'
    : size === 'lg'
    ? 'w-14 h-14 text-3xl'
    : 'w-10 h-10 text-xl'

  if (failed) {
    return (
      <div className={`${sizeClass} rounded-full bg-gray-50 flex items-center justify-center shrink-0`}>
        <span>{emoji}</span>
      </div>
    )
  }

  const isPhoto = idx < 4 // Spoonacular slots

  return (
    <div className={`${sizeClass} rounded-full bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden`}>
      <img
        src={sources[idx]}
        alt={name}
        className={isPhoto ? 'w-full h-full object-cover' : 'w-[80%] h-[80%] object-contain'}
        onError={() => {
          if (idx + 1 < sources.length) setIdx(i => i + 1)
          else setFailed(true)
        }}
      />
    </div>
  )
}
