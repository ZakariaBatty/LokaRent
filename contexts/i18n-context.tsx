'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Language = 'en' | 'fr'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, namespace?: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

// Import all translations
import enTranslations from '@/translations/en'
import frTranslations from '@/translations/fr'

const translations: Record<Language, any> = {
  en: enTranslations,
  fr: frTranslations,
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr')
  const [mounted, setMounted] = useState(false)

  // Hydrate language from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('language') as Language | null
    if (saved && (saved === 'en' || saved === 'fr')) {
      setLanguageState(saved)
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    // Update html lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }

  const t = (key: string, namespace?: string): string => {
    try {
      const keys = key.split('.')
      let value: any = translations[language]

      for (const k of keys) {
        value = value?.[k]
      }

      if (!value) {
        // Fallback to French if key not found
        value = translations['fr']
        for (const k of keys) {
          value = value?.[k]
        }
      }

      return typeof value === 'string' ? value : key
    } catch {
      return key
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    // Return a default context for server components or before provider is mounted
    return {
      language: 'fr' as Language,
      setLanguage: () => {},
      t: (key: string) => key,
    }
  }
  return context
}
