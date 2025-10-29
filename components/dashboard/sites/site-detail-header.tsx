'use client'

import { ArrowLeft, MapPin, Edit, FileText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { Site } from '@/src/db/schema'

type SiteDetailHeaderProps = {
  site: Site
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'active':
      return 'default'
    case 'offline':
      return 'destructive'
    case 'maintenance':
      return 'secondary'
    default:
      return 'outline'
  }
}

export const SiteDetailHeader = ({ site }: SiteDetailHeaderProps) => {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-4">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sites
      </button>

      {/* Header Content */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          {/* Site Name */}
          <h1 className="text-3xl font-bold tracking-tight">{site.name}</h1>

          {/* Location */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {site.city && site.state
                ? `${site.city}, ${site.state}`
                : site.city || site.state || 'Location not specified'}
            </span>
          </div>
        </div>

        {/* Status and Actions */}
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <Badge variant={getStatusVariant(site.status)}>
            {site.status.charAt(0).toUpperCase() + site.status.slice(1)}
          </Badge>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/sites/${site.id}/edit`}
              className="inline-flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit Site
            </Link>

            <Link
              href={`/dashboard/sites/${site.id}/logs`}
              className="inline-flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <FileText className="h-4 w-4" />
              View Logs
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
