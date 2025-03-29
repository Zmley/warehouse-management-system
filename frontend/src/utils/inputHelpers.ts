export const sanitizeQuantityInput = (value: string): number => {
  const sanitized = value.replace(/^0+(?!$)/, '')
  return sanitized === '' ? 0 : Number(sanitized)
}
