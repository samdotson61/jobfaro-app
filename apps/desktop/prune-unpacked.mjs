// After packaging, remove the UNPACKED bundle directories except the native mac-arm64 one (kept for
// local smoke-driving). Leaving several Jobfaro.app bundles in dist-build made Spotlight/Launchpad
// list duplicates — and a clean-rebuild deletes/recreates them, stranding stale LaunchServices
// entries that LOOK like the app but won't open (caught live 2026-08-28). The distributables are the
// zips/exes; testers never need the unpacked dirs.
import { readdirSync, rmSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist-build')
if (existsSync(dist)) {
  for (const d of readdirSync(dist, { withFileTypes: true })) {
    if (d.isDirectory() && d.name !== 'mac-arm64') {
      rmSync(path.join(dist, d.name), { recursive: true, force: true })
      console.log('pruned', d.name + '/')
    }
  }
}
