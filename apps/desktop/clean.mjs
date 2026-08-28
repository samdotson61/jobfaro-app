// Remove dist-build entirely so no stale-version artifacts linger between releases.
import { rmSync } from "node:fs"
rmSync(new URL("./dist-build", import.meta.url), { recursive: true, force: true })
console.log("dist-build/ cleaned")
