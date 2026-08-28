// Install the native build as THE canonical app: /Applications/Jobfaro.app, registered with
// LaunchServices, with the build-output bundles deregistered — so Spotlight/Launchpad show exactly
// one Jobfaro that always opens. Idempotent; run after any dist build you want to use yourself.
import { execSync } from 'node:child_process'
import path from 'node:path'
import { existsSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(here, 'dist-build', 'mac-arm64', 'Jobfaro.app')
if (!existsSync(src)) throw new Error('no mac-arm64 build — run `npm run dist:all` first')
const dest = '/Applications/Jobfaro.app'
rmSync(dest, { recursive: true, force: true })
execSync(`ditto "${src}" "${dest}"`)
const lsreg = '/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister'
execSync(`${lsreg} -f "${dest}"`)
try { execSync(`${lsreg} -u "${src}"`) } catch { /* not registered — fine */ }
console.log('installed:', dest)
