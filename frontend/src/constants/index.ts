export enum ScanMode {
  LOAD = 'load',
  UNLOAD = 'unload'
}

export enum TaskCategoryEnum {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED'
}

export enum Mode {
  CAMERA = 'CAMERA',
  GUN = 'GUN',
  MANUAL = 'MANUAL'
}

export enum DeviceType {
  PHONE = 'PHONE',
  SCANNER = 'SCANNER'
}

export type TransferStatusUI =
  | 'PENDING'
  | 'IN_PROCESS'
  | 'COMPLETED'
  | 'CANCELED'
