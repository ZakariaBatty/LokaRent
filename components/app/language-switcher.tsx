'use client'

import { Globe } from 'lucide-react'
import { useI18n, type Language } from '@/contexts/i18n-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n()

  const languages: Array<{ code: Language; name: string; flag: string }> = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ]

  const currentLang = languages.find(l => l.code === language) || languages[1]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg border border-slate-200/70 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
          aria-label="Language switcher"
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{currentLang.flag}</span>
          <span className="hidden md:inline text-slate-500">{currentLang.code.toUpperCase()}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuLabel className="text-xs">Select Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`cursor-pointer ${language === lang.code ? 'bg-blue-50' : ''}`}
          >
            <span className="mr-2">{lang.flag}</span>
            <span className={language === lang.code ? 'font-semibold text-blue-600' : ''}>
              {lang.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
