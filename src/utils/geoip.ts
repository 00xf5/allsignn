/**
 * geoip.ts
 * Lightweight IP-based geolocation utility.
 * Uses ipapi.co (free tier — no API key required, 1000 req/day).
 * Results are cached in-memory for the session lifetime so multiple
 * components can call getGeoInfo() without extra network round-trips.
 */

export interface GeoInfo {
  ip?: string
  country?: string
  countryCode?: string
  region?: string
  city?: string
  continent?: string
  org?: string        // ISP / organisation string
  timezone?: string
}

let _cache: GeoInfo | null = null
let _inFlight: Promise<GeoInfo> | null = null

/**
 * Fetches the visitor's IP geolocation once per session.
 * Subsequent calls return the cached result immediately.
 * Never throws — returns an empty object on any failure.
 */
export async function getGeoInfo(): Promise<GeoInfo> {
  // Return cached result immediately
  if (_cache) return _cache

  // Deduplicate concurrent callers
  if (_inFlight) return _inFlight

  _inFlight = (async (): Promise<GeoInfo> => {
    try {
      const res = await fetch('https://ipwho.is/', {
        signal: AbortSignal.timeout(5000), // 5 s max
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const d = await res.json()

      if (!d.success) throw new Error('API returned unsuccessful response')

      const geo: GeoInfo = {
        ip:          d.ip,
        country:     d.country,
        countryCode: d.country_code,
        region:      d.region,
        city:        d.city,
        continent:   d.continent,
        org:         d.connection?.isp || d.connection?.org,
        timezone:    d.timezone?.id,
      }

      _cache = geo
      return geo
    } catch (err) {
      // Silently fail — geo is nice-to-have, never block the UX
      console.error('GeoIP fetch failed:', err)
      _cache = {}
      return {}
    } finally {
      _inFlight = null
    }
  })()

  return _inFlight
}

// Map ISO continent codes to human-readable labels
function continentLabel(code: string): string {
  const map: Record<string, string> = {
    AF: 'Africa',
    AN: 'Antarctica',
    AS: 'Asia',
    EU: 'Europe',
    NA: 'North America',
    OC: 'Oceania',
    SA: 'South America',
  }
  return map[code] ?? code
}
