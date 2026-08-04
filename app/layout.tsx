import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { AgencyProvider } from '@/contexts/agency-context'
import { I18nProvider } from '@/contexts/i18n-context'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'LokaRent — Solution moderne de gestion de flotte automobile',
  description:
    "LokaRent est la plateforme SaaS tout-en-un pour les agences de location de voitures au Maroc. Gérez votre flotte, vos réservations, vos clients et vos finances depuis une seule interface.",
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#0a0f1f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`dark ${geist.variable} ${geistMono.variable}`}>
      <body className="bg-background font-sans antialiased">
        <I18nProvider>
          <AgencyProvider>
            {children}
          </AgencyProvider>
        </I18nProvider>
        <Toaster
          position="bottom-right"
          theme="light"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast:
                'rounded-xl border border-slate-200/80 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.12)] backdrop-blur',
              title: 'font-semibold text-slate-900',
              description: 'text-slate-500',
            },
          }}
        />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
