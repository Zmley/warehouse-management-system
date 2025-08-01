export const saveTokens = (data: {
  accessToken: string
  idToken: string
  refreshToken: string
}) => {
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('idToken', data.idToken)
  localStorage.setItem('refreshToken', data.refreshToken)
}

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
