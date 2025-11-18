import { requireAdmin } from "@/lib/admin"
import { getPromptTemplates } from "@/actions/prompts"
import AdminLayoutClient from "@/components/admin/shared/admin-layout-client"
import { WrappedPlayground } from "@/components/admin/playground/wrapped-playground"

export const dynamic = 'force-dynamic'

export default async function PlaygroundPage({
  searchParams,
}: {
  searchParams: { templateId?: string }
}) {
  await requireAdmin()

  // Get all templates for selection
  const templatesResult = await getPromptTemplates()
  const templates = templatesResult.success ? templatesResult.data : []

  return (
    <AdminLayoutClient>
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Wrapped Playground
            </h1>
            <p className="text-sm text-slate-400">
              Test prompt templates with sample data and different models
            </p>
          </div>

          <WrappedPlayground templates={templates} initialTemplateId={searchParams.templateId} />
        </div>
      </div>
    </AdminLayoutClient>
  )
}

