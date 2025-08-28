import Bin from './bin.model'
import Inventory from 'routes/inventory/inventory.model'
import AppError from 'utils/appError'
import { literal, Op, WhereOptions } from 'sequelize'
import { BinUploadPayload } from 'types/bin'

export const getBinByBinCode = async (binCode: string) => {
  try {
    console.log('🔍 Fetching bin with code:', binCode)

    const bin = await Bin.findOne({
      where: {
        binCode
      }
    })

    if (!bin) {
      throw new AppError(404, `❌${binCode} is not in system so far`)
    }

    return bin
  } catch (error) {
    console.error('Error fetching bin by code:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to fetch bin by code')
  }
}

export const getBinCodesByProductCode = async (
  productCode: string,
  warehouseID: string
): Promise<{ binCode: string; quantity: number }[]> => {
  try {
    const bins = await Bin.findAll({
      where: {
        warehouseID,
        type: 'INVENTORY'
      },
      include: [
        {
          model: Inventory,
          as: 'inventories',
          where: { productCode },
          attributes: ['quantity']
        }
      ],
      attributes: ['binCode']
    })

    if (!bins.length) {
      throw new AppError(404, `❌ No ${productCode} in current warehouse!`)
    }

    return bins.map(bin => ({
      binCode: bin.binCode,
      quantity: bin.inventories
        ? bin.inventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0)
        : 0
    }))
  } catch (error) {
    console.error('Error fetching binCodes:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to fetch binCodes')
  }
}

export const getBinCodesInWarehouse = async (
  warehouseID: string
): Promise<{ binID: string; binCode: string }[]> => {
  try {
    const bins = await Bin.findAll({
      where: {
        warehouseID,
        type: {
          [Op.in]: ['INVENTORY', 'PICK_UP']
        }
      },
      attributes: ['binID', 'binCode']
    })

    return bins.map(bin => ({
      binID: bin.binID,
      binCode: bin.binCode
    }))
  } catch (error) {
    console.error('Error fetching bins:', error)
    if (error instanceof AppError) throw error
    throw new AppError(500, '❌ Failed to fetch bins')
  }
}

const escapeLike = (s: string) => s.replace(/([\\%_])/g, '\\$1')

export const getBins = async (
  warehouseID: string,
  page: number,
  limit: number,
  type?: string,
  keyword?: string
) => {
  const offset = (page - 1) * limit

  const where: WhereOptions = { warehouseID }
  if (type) where.type = type

  if (keyword && keyword.trim() !== '') {
    const k = keyword.trim()
    const escaped = escapeLike(k)

    Object.assign(where, {
      [Op.and]: [
        { warehouseID },
        ...(type ? [{ type }] : []),
        {
          [Op.or]: [
            { binCode: { [Op.iLike]: `${escaped}%` } },
            { defaultProductCodes: { [Op.iLike]: `%${escaped}%` } }
          ]
        }
      ]
    })
  }

  const { rows, count } = await Bin.findAndCountAll({
    where,
    limit,
    offset,
    order: [['binCode', 'ASC']]
  })

  return { data: rows, total: count }
}

export const addBins = async (binList: BinUploadPayload[]) => {
  let insertedCount = 0
  let updatedCount = 0

  const CHUNK_SIZE = 100

  for (let i = 0; i < binList.length; i += CHUNK_SIZE) {
    const chunk = binList.slice(i, i + CHUNK_SIZE)

    await Promise.all(
      chunk.map(async bin => {
        const { warehouseID, binCode, type, defaultProductCodes } = bin
        const joinedCodes = defaultProductCodes?.join(',') || null

        const [record, created] = await Bin.findOrCreate({
          where: { binCode, warehouseID },
          defaults: { type, defaultProductCodes: joinedCodes }
        })

        if (created) {
          insertedCount++
        } else {
          await record.update({ type, defaultProductCodes: joinedCodes })
          updatedCount++
        }
      })
    )
  }

  return {
    insertedCount,
    updatedCount
  }
}

export const getPickBinByProductCode = async (
  productCode: string,
  warehouseID: string
) => {
  const bin = await Bin.findOne({
    where: {
      type: 'PICK_UP',
      warehouseID,
      [Op.and]: literal(
        `'${productCode}' = ANY(string_to_array("defaultProductCodes", ','))`
      )
    }
  })

  return bin
}

export const isPickUpBin = async (binCode: string): Promise<boolean> => {
  const bin = await Bin.findOne({ where: { binCode } })
  return bin?.type === 'PICK_UP'
}

export const getWarehouseIDByBinCode = async (
  binCode: string
): Promise<string> => {
  const bin = await Bin.findOne({
    where: { binCode },
    attributes: ['warehouseID']
  })

  if (!bin) {
    throw new AppError(404, `❌ Bin with code ${binCode} not found.`)
  }

  return bin.warehouseID
}

export const getBinsByBinCodes = async (
  inventoryList: { binCode: string }[]
) => {
  const binCodes = [...new Set(inventoryList.map(item => item.binCode.trim()))]

  const bins = await Bin.findAll({
    where: {
      binCode: {
        [Op.in]: binCodes
      }
    }
  })

  return bins
}

export const updateDefaultProductCodes = async (
  binID: string,
  defaultProductCodes: string
) => {
  const targetBin = await Bin.findByPk(binID)
  if (!targetBin) return null

  const warehouseID = targetBin.warehouseID

  const incomingCodes = defaultProductCodes
    .split(',')
    .map(c => c.trim())
    .filter(c => c)

  for (const productCode of incomingCodes) {
    const conflictingBin = await Bin.findOne({
      where: {
        binID: { [Op.ne]: binID },
        warehouseID,
        defaultProductCodes: {
          [Op.like]: `%${productCode}%`
        }
      }
    })

    if (conflictingBin) {
      const originalList = (conflictingBin.defaultProductCodes || '')
        .split(',')
        .map(c => c.trim())
        .filter(c => c)

      const newList = originalList.filter(c => c !== productCode)
      await conflictingBin.update({
        defaultProductCodes: newList.length > 0 ? newList.join(',') : null
      })
    }
  }

  const updated = await targetBin.update({
    defaultProductCodes:
      incomingCodes.length > 0 ? incomingCodes.join(',') : null
  })

  return updated
}

export const deleteBinByBInID = async (binID: string): Promise<boolean> => {
  const result = await Bin.destroy({ where: { binID } })
  return result > 0
}

import { Transaction, UniqueConstraintError } from 'sequelize'
import { sequelize } from 'config/db'
import { BinType } from 'constants/index'

export type UpdateBinInput = {
  binID: string
  binCode?: string
  type?: BinType
  defaultProductCodes?: string | null
}

export type UpdateBinsResult = {
  success: boolean
  updatedCount: number
  failedCount: number
  results: Array<
    | { binID: string; success: true; bin: Bin }
    | { binID: string; success: false; errorCode: string; message: string }
  >
}

async function updateBinByEntity(
  bin: Bin,
  patch: Omit<UpdateBinInput, 'binID'>,
  t?: Transaction
): Promise<Bin> {
  if (typeof patch.binCode !== 'undefined') {
    bin.binCode = patch.binCode
  }
  if (typeof patch.type !== 'undefined') {
    if (!Object.values(BinType).includes(patch.type)) {
      const err = new Error('Invalid bin type')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(err as any).errorCode = 'INVALID_BIN_TYPE'
      throw err
    }
    bin.type = patch.type
  }
  if (typeof patch.defaultProductCodes !== 'undefined') {
    bin.defaultProductCodes =
      patch.defaultProductCodes === '' ? null : patch.defaultProductCodes
  }

  await bin.save({ transaction: t })
  return bin
}

export async function updateBins(
  items: UpdateBinInput[]
): Promise<UpdateBinsResult> {
  if (!Array.isArray(items) || items.length === 0) {
    return { success: true, updatedCount: 0, failedCount: 0, results: [] }
  }

  const lastPatchById = new Map<string, UpdateBinInput>()
  for (const it of items) {
    if (it?.binID) lastPatchById.set(it.binID, it)
  }
  const deduped = Array.from(lastPatchById.values())

  const targetIds = deduped.map(d => d.binID)
  const existing = await Bin.findAll({
    where: { binID: { [Op.in]: targetIds } }
  })
  const mapById = new Map(existing.map(b => [b.binID, b]))

  let updatedCount = 0
  let failedCount = 0
  const results: UpdateBinsResult['results'] = []

  for (const patch of deduped) {
    const entity = mapById.get(patch.binID)
    if (!entity) {
      failedCount++
      results.push({
        binID: patch.binID,
        success: false,
        errorCode: 'BIN_NOT_FOUND',
        message: 'Bin not found'
      })
      continue
    }

    const t = await sequelize.transaction()
    try {
      const updated = await updateBinByEntity(
        entity,
        {
          binCode: patch.binCode,
          type: patch.type,
          defaultProductCodes: patch.defaultProductCodes
        },
        t
      )
      await t.commit()
      updatedCount++
      results.push({ binID: patch.binID, success: true, bin: updated })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      await t.rollback()

      let errorCode = 'UNKNOWN_ERROR'
      let message = err?.message || 'Update failed'

      if (err instanceof UniqueConstraintError) {
        errorCode = 'BIN_CODE_DUPLICATE'
        message = 'binCode already exists'
      } else if (err?.errorCode === 'INVALID_BIN_TYPE') {
        errorCode = 'INVALID_BIN_TYPE'
        message = 'Invalid bin type'
      }

      failedCount++
      results.push({
        binID: patch.binID,
        success: false,
        errorCode,
        message
      })
    }
  }

  return {
    success: failedCount === 0,
    updatedCount,
    failedCount,
    results
  }
}

export async function updateBinByID(input: UpdateBinInput): Promise<Bin> {
  const bin = await Bin.findByPk(input.binID)
  if (!bin) {
    const err = new Error('Bin not found')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(err as any).errorCode = 'BIN_NOT_FOUND'
    throw err
  }
  return updateBinByEntity(
    bin,
    {
      binCode: input.binCode,
      type: input.type,
      defaultProductCodes: input.defaultProductCodes
    },
    undefined
  )
}

export type UpdateBinDto = {
  binCode?: string
  type?: BinType
  defaultProductCodes?: string | null
}

function normalizeCodes(codes?: string | null): string | null {
  if (codes == null) return null
  const arr = String(codes)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  const uniq = Array.from(new Set(arr))
  return uniq.length ? uniq.join(',') : null
}

export async function updateSingleBin(binID: string, payload: UpdateBinDto) {
  return sequelize.transaction(async (t: Transaction) => {
    const bin = await Bin.findByPk(binID, { transaction: t })
    if (!bin) throw new AppError(404, 'BIN_NOT_FOUND')

    const updates: Partial<Bin> = {}

    if ('binCode' in payload) {
      const newCode = payload.binCode?.trim()
      if (newCode && newCode !== bin.binCode) {
        const dup = await Bin.findOne({
          where: { binCode: newCode },
          transaction: t
        })
        if (dup) throw new AppError(409, 'BIN_CODE_DUPLICATE')
        updates.binCode = newCode
      }
    }

    if ('type' in payload) {
      const newType = payload.type
      if (newType && !Object.values(BinType).includes(newType)) {
        throw new AppError(400, 'BIN_TYPE_INVALID')
      }
      if (newType) updates.type = newType
    }

    if ('defaultProductCodes' in payload) {
      const normalized = normalizeCodes(payload.defaultProductCodes ?? null)
      updates.defaultProductCodes = normalized

      if (normalized) {
        const codes = normalized.split(',')
        for (const code of codes) {
          const conflict = await Bin.findOne({
            where: {
              binID: { [Op.ne]: binID },
              warehouseID: bin.warehouseID,
              defaultProductCodes: { [Op.iLike]: `%${code}%` }
            },
            transaction: t
          })
          if (conflict) {
            throw new AppError(409, 'PRODUCT_CODE_ALREADY_ASSIGNED')
          }
        }
      }
    }

    await bin.update(updates, { transaction: t })
    await bin.reload({ transaction: t })

    return bin
  })
}
