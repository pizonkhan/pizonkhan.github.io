import type { Metadata } from 'next'
import { site } from '@/content/site'
import { icebergLakehousePlatform } from '@/content/projects/iceberg-lakehouse-platform'
import { ProjectLayout } from '@/components/project/ProjectLayout'
import {
  LakehouseAtomicity,
  LakehouseCentrepiece,
  LakehousePointInTime,
  LakehouseScd,
  LakehouseWap,
} from '@/components/projects/lakehouse/LakehouseVisuals'

export const metadata: Metadata = {
  title: `${icebergLakehousePlatform.title} · ${site.name}`,
  description: icebergLakehousePlatform.tagline,
}

/**
 * Server Component: metadata plus one ProjectLayout call, nothing else. Every dynamic import
 * for this route, and the viewport-proximity gating that defers them, lives in
 * LakehouseVisuals.tsx, a Client Component. ssr: false inside a Server Component fails
 * npm run build outright, so that split is load-bearing, not a style choice.
 */
export default function IcebergLakehousePlatformPage() {
  return (
    <ProjectLayout
      record={icebergLakehousePlatform}
      centrepiece={<LakehouseCentrepiece />}
      sectionVisuals={{
        'point-in-time': <LakehousePointInTime />,
        scd: <LakehouseScd />,
        wap: <LakehouseWap />,
        atomicity: <LakehouseAtomicity />,
      }}
    />
  )
}
