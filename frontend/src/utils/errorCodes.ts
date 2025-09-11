export const ERROR_CODE: Record<string, string> = {
  TASK_ALREADY_ACTIVE: 'taskList.error.taskAlreadyActive',
  CART_NOT_EMPTY: 'taskList.error.cartNotEmpty',
  TASK_NOT_FOUND: 'taskList.error.taskNotFound',
  TASK_NOT_PENDING: 'taskList.error.taskNotPending',
  UNAUTHORIZED: 'common.error.unauthorized',
  FORBIDDEN: 'common.error.forbidden',
  UNKNOWN_ERROR: 'taskList.error.unknown'
}

export const PICKER_TASK_ERROR_CODE: Record<string, string> = {
  TASK_DUPLICATE: 'picker.error.taskDuplicate',
  UNAUTHORIZED: 'common.error.unauthorized',
  FORBIDDEN: 'common.error.forbidden',
  UNKNOWN_ERROR: 'createTask.error.unknown'
}

export const CREATE_TASK_ERROR_CODE: Record<string, string> = {
  TASK_DUPLICATE: 'createTask.error.taskDuplicate',
  UNAUTHORIZED: 'common.error.unauthorized',
  FORBIDDEN: 'common.error.forbidden',
  UNKNOWN_ERROR: 'createTask.error.unknown'
}
