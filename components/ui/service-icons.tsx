interface ServiceIconProps {
  className?: string
}

export function PlexIcon({ className = "w-5 h-5" }: ServiceIconProps) {
  return (
    <img
      src="/plex.ico"
      alt="Plex"
      className={className}
    />
  )
}

export function TautulliIcon({ className = "w-5 h-5" }: ServiceIconProps) {
  return (
    <img
      src="/tautulli.ico"
      alt="Tautulli"
      className={className}
    />
  )
}

export function RadarrIcon({ className = "w-5 h-5" }: ServiceIconProps) {
  return (
    <img
      src="/radarr.ico"
      alt="Radarr"
      className={className}
    />
  )
}

export function SonarrIcon({ className = "w-5 h-5" }: ServiceIconProps) {
  return (
    <img
      src="/sonarr.ico"
      alt="Sonarr"
      className={className}
    />
  )
}

