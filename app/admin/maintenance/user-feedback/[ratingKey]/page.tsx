import { getMediaMarkDetails } from "@/actions/user-feedback"
import { MediaMarkDetailsView } from "@/components/admin/maintenance/media-mark-details"
import { ErrorState } from "@/components/ui/error-state"
import { PlexIcon, TautulliIcon, RadarrIcon, SonarrIcon } from "@/components/ui/service-icons"
import Link from "next/link"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{
    ratingKey: string
  }>
}

export default async function MediaMarkDetailPage({ params }: PageProps) {
  const { ratingKey } = await params
  const result = await getMediaMarkDetails(ratingKey)

  if (!result.success) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link
              href="/admin/maintenance/user-feedback"
              className="text-sm text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to User Feedback
            </Link>
          </div>
          <ErrorState title="Failed to load media details" message={result.error} />
        </div>
      </div>
    )
  }

  const details = result.data

  if (!details) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <ErrorState title="Media details not found" message="No details available for this media" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin/maintenance/user-feedback"
            className="text-sm text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 mb-4"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to User Feedback
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{details.title}</h1>
            <div className="flex items-center gap-2">
              {details.externalLinks.plex && (
                <a
                  href={details.externalLinks.plex}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-amber-500 transition-colors"
                  title="View in Plex"
                >
                  <PlexIcon />
                </a>
              )}
              {details.externalLinks.tautulli && (
                <a
                  href={details.externalLinks.tautulli}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-blue-500 transition-colors"
                  title="View in Tautulli"
                >
                  <TautulliIcon />
                </a>
              )}
              {details.externalLinks.radarr && (
                <a
                  href={details.externalLinks.radarr}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-purple-500 transition-colors"
                  title="View in Radarr"
                >
                  <RadarrIcon />
                </a>
              )}
              {details.externalLinks.sonarr && (
                <a
                  href={details.externalLinks.sonarr}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-emerald-500 transition-colors"
                  title="View in Sonarr"
                >
                  <SonarrIcon />
                </a>
              )}
            </div>
          </div>
          {details.year && <p className="text-sm text-slate-400">{details.year}</p>}
        </div>

        <MediaMarkDetailsView details={details} />
      </div>
    </div>
  )
}
