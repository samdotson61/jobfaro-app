// Install the native build as THE canonical app: /Applications/Jobfaro.app, registered with
// LaunchServices, with the build-output bundles deregistered — so Spotlight/Launchpad show exactly
// one Jobfaro that always opens. Idempotent; run after any dist build you want to use yourself.
import { execSync } from 'node:child_process'
import path from 'node:path'
import { readdirSync, rmSync, mkdtempSync } from 'node:fs'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(here, 'dist-build')
const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
const zip = readdirSync(dist).find((f) => f.includes(`mac-${arch}`) && f.endsWith('.zip'))
if (!zip) throw new Error(`no mac-${arch} zip in dist-build — run \`npm run dist:all\` first`)
// Extract from the distributable zip via a temp dir — dist-build keeps ZERO unpacked bundles
// (an unpacked Jobfaro.app anywhere on indexed disk is a duplicate in Spotlight/Launchpad).
const tmp = mkdtempSync(path.join(os.tmpdir(), 'jobfaro-install-'))
const dest = '/Applications/Jobfaro.app'
try {
  execSync(`ditto -x -k "${path.join(dist, zip)}" "${tmp}"`)
  rmSync(dest, { recursive: true, force: true })
  execSync(`ditto "${path.join(tmp, 'Jobfaro.app')}" "${dest}"`)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
const lsreg = '/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister'
execSync(`${lsreg} -f "${dest}"`)
console.log('installed:', dest, 'from', zip)
