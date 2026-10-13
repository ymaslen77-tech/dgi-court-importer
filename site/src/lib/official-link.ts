export function isOfficialCourtLink(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return false
    const host = url.hostname.toLowerCase()
    return ['mos-gorsud.ru', 'sudrf.ru', 'vsrf.ru', 'kad.arbitr.ru'].some(domain => host === domain || host.endsWith('.' + domain))
  } catch { return false }
}
