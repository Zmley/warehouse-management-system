// utils/barcode.ts
export const isValidBarcode = (code: string): boolean => /^\d{12}$/.test(code)
