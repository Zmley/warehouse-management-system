export const saveTokens = (data: {
  accessToken: string
  idToken: string
  refreshToken: string
}) => {
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('idToken', data.idToken)
  localStorage.setItem('refreshToken', data.refreshToken)
}

const DEVICE_KEY = 'device'
const SCAN_MODE_KEY = 'scanMode'
const REMEMBER_EMAIL_KEY = 'savedEmail'
const REMEMBER_PASSWORD_KEY = 'savedPassword'

export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken')
}

export const clearTokens = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('idToken')
}

export const areTokensValid = (): boolean => {
  return !!(
    localStorage.getItem('accessToken') &&
    localStorage.getItem('idToken') &&
    localStorage.getItem('refreshToken')
  )
}

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken')
}

export const setSourceBinCode = (code: string) => {
  localStorage.setItem('sourceBinCode', code)
}

export const getSourceBinCode = (): string | null => {
  return localStorage.getItem('sourceBinCode')
}

export type StoredScanMode = 'camera' | 'gun'

export const getScanMode = (): StoredScanMode => {
  const raw = localStorage.getItem(SCAN_MODE_KEY)
  return raw === 'camera' || raw === 'gun' ? raw : 'gun'
}

export const setScanMode = (mode: StoredScanMode) => {
  localStorage.setItem(SCAN_MODE_KEY, mode)
}

export const getRememberedLogin = (): {
  email: string
  password: string
} | null => {
  const email = localStorage.getItem(REMEMBER_EMAIL_KEY)
  const password = localStorage.getItem(REMEMBER_PASSWORD_KEY)
  if (!email || !password) return null
  return { email, password }
}

export const setRememberedLogin = (email: string, password: string) => {
  localStorage.setItem(REMEMBER_EMAIL_KEY, email)
  localStorage.setItem(REMEMBER_PASSWORD_KEY, password)
}

export const clearRememberedLogin = () => {
  localStorage.removeItem(REMEMBER_EMAIL_KEY)
  localStorage.removeItem(REMEMBER_PASSWORD_KEY)
}

export const getDevicePreference = (): string | null => {
  return localStorage.getItem(DEVICE_KEY)
}

export const setDevicePreference = (device: string) => {
  localStorage.setItem(DEVICE_KEY, device)
}
