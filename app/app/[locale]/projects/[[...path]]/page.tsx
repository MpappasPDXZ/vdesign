import { setRequestLocale } from 'next-intl/server'
import { Blueprint3DApp } from '@/components/blueprint3d/Blueprint3DApp'
import type { SupportedLanguage } from '@/i18n/routing'

interface ProjectsRoutePageProps {
  params: Promise<{ locale: SupportedLanguage; path?: string[] }>
}

export default async function ProjectsRoutePage({ params }: ProjectsRoutePageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="w-full h-screen overflow-hidden bg-background">
      <Blueprint3DApp config={{ isLanguageOption: true }} />
    </div>
  )
}
