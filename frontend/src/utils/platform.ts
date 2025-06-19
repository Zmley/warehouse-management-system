export const isAndroid = (): boolean => {
  return /Android/i.test(navigator.userAgent)
}

export const isIOS = (): boolean => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}
