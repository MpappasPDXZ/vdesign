import { setRequestLocale } from 'next-intl/server'
import { redirect } from '@/i18n/routing'
import type { SupportedLanguage } from '@/i18n/routing'

interface HomePageProps {
  params: Promise<{ locale: SupportedLanguage }>
}

/** `/` → project picker at `/projects` */
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  redirect({ href: '/projects', locale })
}
