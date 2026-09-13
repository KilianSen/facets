import { usePath } from '../router/router'
import { App } from './App'
import { ArchetypesPage } from '../archetypes/ArchetypesPage'
import { ArchetypeDetailPage } from '../archetypes/ArchetypeDetailPage'
import { MethodPage } from '../method/MethodPage'
import { ComparePage } from '../compare/ComparePage'

/**
 * Top-level route switch. The quiz <App/> owns "/" (and the /r/<id> share links it already handles);
 * the archetype browse pages live under /archetypes. Each route has a static index.html shell from
 * scripts/gen-share.ts, so deep links work on a static host and the SPA hydrates onto them.
 */
export function Root() {
  const path = usePath()

  const detail = path.match(/^\/archetypes\/([^/]+)\/?$/)
  if (detail) return <ArchetypeDetailPage id={decodeURIComponent(detail[1])} />
  if (/^\/archetypes\/?$/.test(path)) return <ArchetypesPage />
  if (/^\/method\/?$/.test(path)) return <MethodPage />
  if (/^\/compare\/?$/.test(path)) return <ComparePage />

  return <App />
}
