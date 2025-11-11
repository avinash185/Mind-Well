import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext({
  theme: 'system',
  setTheme: () => {},
})

// Read persisted preference or default to 'system'
function getInitialPreference() {
  const stored = localStorage.getItem('themePreference')
  return stored || 'system'
}

function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function applyHtmlClass(effectiveTheme) {
  const root = document.documentElement
  if (!root) return
  if (effectiveTheme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialPreference())

  const effectiveTheme = useMemo(() => {
    return theme === 'system' ? getSystemTheme() : theme
  }, [theme])

  useEffect(() => {
    applyHtmlClass(effectiveTheme)
    localStorage.setItem('themePreference', theme)
  }, [theme, effectiveTheme])

  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyHtmlClass(media.matches ? 'dark' : 'light')
    media.addEventListener?.('change', handler)
    return () => media.removeEventListener?.('change', handler)
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme, effectiveTheme }), [theme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}