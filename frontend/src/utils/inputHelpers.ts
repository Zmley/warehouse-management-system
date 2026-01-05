export const sanitizeQuantityInput = (value: string): number => {
  const sanitized = value.replace(/^0+(?!$)/, '')
  return sanitized === '' ? 0 : Number(sanitized)
}

export const startsWithFilter = (options: string[], query: string) => {
  const key = (query || '').trim().toLowerCase()
  if (!key) return []
  const list = options.filter(o => o.toLowerCase().startsWith(key))
  list.sort((a, b) => a.length - b.length || a.localeCompare(b))
  return list.slice(0, 50)
}
