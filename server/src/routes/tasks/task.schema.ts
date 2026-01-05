import Joi from 'joi'
import { TaskStatus } from 'constants/index'

export const TaskIDParamsSchema = Joi.object({
  taskID: Joi.string().trim().required().messages({
    'any.required': 'taskID is required.',
    'string.empty': 'taskID cannot be empty.'
  })
})

export const AcceptTaskParamsSchema = TaskIDParamsSchema

export const CancelTaskParamsSchema = TaskIDParamsSchema

export const GetTasksQuerySchema = Joi.object({
  warehouseID: Joi.string().trim().optional(),
  keyword: Joi.string().trim().allow('').optional(),
  status: Joi.string()
    .valid('ALL', ...Object.values(TaskStatus))
    .optional()
}).unknown(false)

export const CreateTaskBodySchema = Joi.object({
  payload: Joi.object({
    productCode: Joi.string().trim().required(),
    destinationBinCode: Joi.string().trim().required(),
    sourceBinCode: Joi.string().trim().allow('').optional(),
    quantity: Joi.number().integer().min(0).optional().allow(null).empty(''),
    warehouseID: Joi.string().trim().required()
  }).required()
}).unknown(false)

export const UpdateTaskParamsSchema = TaskIDParamsSchema

export const UpdateTaskBodySchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(TaskStatus))
    .required(),
  sourceBinCode: Joi.string().trim().allow('').optional()
}).unknown(false)

export const GetFinishedTasksQuerySchema = Joi.object({
  warehouseID: Joi.string().required(),
  status: Joi.string().valid('COMPLETED', 'CANCELED').required(),
  keyword: Joi.string().allow('').optional(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(200).default(20)
})
