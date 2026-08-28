// Jobfaro — listing liveness (1.53.0). An evaluated row used to keep its Apply badge forever: rows past
// status `scanned` are never pruned, and the dead-JD honesty shipped in 1.48.1 only fires when the user
// reaches tailor/outreach. Measured on the real pipeline (2026-08-28 audit): 8 of 32 Apply-band roles —
// including both oldest ones — were no longer posted. This module closes that gap by re-using the
// provider contract as the liveness probe:
//   • fetchJob succeeds with real JD text            → 'live'  (the board still serves the posting)
//   • the provider throws HTTP 403 / 404 / 410       → 'gone'  (Workday's CXS API 403s an unposted job,
//     Greenhouse/iCIMS 404 a closed one — verified live against 32 real Apply-band URLs, 2026-08-28)
//   • anything else (network error, empty JD, no provider) → 'unknown' — NEVER claimed gone. Honesty
//     rule: only a positive board signal moves listing_state; an unreachable board proves nothing.

import { fetchJobDescription } from '../providers/_contract.mjs'

const GONE_STATUS_RE = /HTTP (?:403|404|410) /

// Pure: classify a provider fetch error message. Exported for offline tests.
export function classifyFetchError(message) {
  return GONE_STATUS_RE.test(String(message || '')) ? 'gone' : 'unknown'
}

// Probe ONE posting. Returns { state: 'live'|'gone'|'unknown', title?, error? }. Never throws.
export async function checkListing(url) {
  try {
    const d = await fetchJobDescription(url)
    if (d && String(d.description || '').trim()) return { state: 'live', title: d.title || '' }
    // A provider matched but returned no JD text (JS-rendered page, odd shape) — not proof either way.
    return { state: 'unknown', title: (d && d.title) || '' }
  } catch (e) {
    return { state: classifyFetchError(e && e.message), error: String((e && e.message) || e).slice(0, 200) }
  }
}
