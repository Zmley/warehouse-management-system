export enum BinType {
  PICK_UP = 'PICK_UP',
  INVENTORY = 'INVENTORY',
  CART = 'CART',
  AISLE = 'AISLE'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROCESS = 'IN_PROCESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PICKER = 'PICKER',
  TRANSPORT_WORKER = 'TRANSPORT_WORKER',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum transferTaskStatus {
  PENDING = 'PENDING',
  IN_PROCESS = 'IN_PROCESS',
  COMPLETED = 'COMPLETED'
}
