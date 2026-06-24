export interface GeoInfo {
  ip?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  continent?: string;
  org?: string;
  timezone?: string;
}

export async function resolveGeo(
  clientIp: string | null,
  fallback: GeoInfo,
): Promise<GeoInfo> {
  if (!clientIp) return fallback;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://ipwho.is/${clientIp}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('ipwho.is returned success=false');

    return {
      ip: data.ip,
      country: data.country,
      countryCode: data.country_code,
      region: data.region,
      city: data.city,
      continent: data.continent,
      org: data.connection?.isp || data.connection?.org,
      timezone: data.timezone?.id,
    };
  } catch (err) {
    console.error('Server-side geo lookup failed, using client fallback:', err);
    return fallback;
  }
}
