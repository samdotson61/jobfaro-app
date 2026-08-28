// Vendor the engine: `npm pack` the repo root (exactly what an npm install would ship — the package.json
// `files` set, no repo node_modules, no personal config/data) and install the tarball as the `jobfaro`
// dependency. A file: SYMLINK doesn't survive electron-builder (it traverses the whole repo), and the
// tarball also makes the packed app resolve its data home the way a tester's machine will (~/.jobfaro).
import { execSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const vendor = path.join(here, 'vendor')
rmSync(vendor, { recursive: true, force: true })
mkdirSync(vendor, { recursive: true })
execSync(`npm pack "${root}" --pack-destination "${vendor}"`, { stdio: 'inherit' })
const tgz = readdirSync(vendor).find((f) => f.startsWith('jobfaro-') && f.endsWith('.tgz'))
if (!tgz) throw new Error('npm pack produced no tarball')
execSync(`npm install --no-audit --no-fund "${path.join(vendor, tgz)}"`, { cwd: here, stdio: 'inherit' })
console.log('engine vendored:', tgz)
