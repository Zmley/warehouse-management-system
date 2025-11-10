/* eslint-disable @typescript-eslint/no-explicit-any */
import Log from 'routes/log/log.model'
import Product from 'routes/products/product.model'
import { Op, Transaction, WhereOptions } from 'sequelize'
import { v4 as uuidv4 } from 'uuid'
import { fn, col, where as sqlWhere } from 'sequelize'
import Account from 'routes/accounts/accounts.model'
import Bin from 'routes/bins/bin.model'
import { BinType } from 'constants/index'
import { Group, Item, LogRow, SessionFilter } from 'types/log'

function normalizeItems(items?: Item[]): Item[] {
  return (items || []).filter(
    x => !!x?.productCode && Number.isInteger(x?.quantity) && x.quantity > 0
  )
}

async function touchProductUpdatedAt(productCode: string, t?: Transaction) {
  await Product.increment([], {
    where: { productCode },
    transaction: t,
    silent: false
  })
  console.log(`[Product.updatedAt] touched: ${productCode}`)
}

async function getBinTypeCached(
  binID: string | null,
  cache: Map<string, BinType>
): Promise<BinType | null> {
  if (!binID) return null
  if (cache.has(binID)) return cache.get(binID)!
  const row = await Bin.findOne({ attributes: ['type'], where: { binID } })
  const type = (row?.get('type') as BinType) ?? null
  if (type) cache.set(binID, type)
  return type
}

export async function createOpenLogsOnLoad(params: {
  accountID: string
  items: Item[]
  warehouseID: string
  binID?: string | null
}) {
  try {
    let sourceBinID: string | null = null

    if (params.binID) {
      const source = (await Bin.findOne({
        where: {
          binID: params.binID
        },
        attributes: ['binID'],
        raw: true
      })) as { binID: string } | null

      sourceBinID = source?.binID ?? null
    }

    const open = await Log.findOne({
      where: {
        accountID: params.accountID,
        destinationBinID: { [Op.is]: null }
      },
      order: [['createdAt', 'DESC']],
      attributes: ['sessionID']
    })

    const sessionID = (open?.get('sessionID') as string | undefined) ?? uuidv4()

    const rows = normalizeItems(params.items).map(x => ({
      productCode: x.productCode,
      quantity: x.quantity,
      sourceBinID,
      destinationBinID: null,
      accountID: params.accountID,
      sessionID,
      isMerged: !!x.isMerged,
      warehouseID: params.warehouseID
    }))

    if (rows.length) {
      await Log.bulkCreate(rows)
    }
  } catch (e: any) {
    console.warn('[log.silent] createOpenLogsOnLoad skip:', e?.message)
  }
}

export async function fulfillLogsOnUnload(params: {
  accountID: string
  items: Item[]
  binID: string
}) {
  try {
    const destBinID = params.binID

    const wanted = normalizeItems(params.items)
    if (!wanted.length) return

    const t: Transaction = await Log.sequelize!.transaction()
    try {
      const typeCache = new Map<string, BinType>()
      const destType = await getBinTypeCached(destBinID, typeCache)

      const maybeTouchProduct = async (
        srcID: string | null,
        productCode: string
      ) => {
        if (!srcID) return
        if (destType !== BinType.PICK_UP) return
        const srcType = await getBinTypeCached(srcID, typeCache)
        if (srcType === BinType.INVENTORY) {
          await touchProductUpdatedAt(productCode, t)
        }
      }

      for (const item of wanted) {
        let remaining = item.quantity
        if (remaining <= 0) continue

        const openRows = await Log.findAll({
          where: {
            accountID: params.accountID,
            productCode: item.productCode,
            destinationBinID: { [Op.is]: null }
          },
          order: [['createdAt', 'DESC']],
          transaction: t,
          lock: t.LOCK.UPDATE
        })
        if (!openRows.length) continue

        let matched = false
        for (const row of openRows) {
          const q = (row.get('quantity') as number) ?? 0
          if (q === remaining) {
            await row.update(
              { destinationBinID: destBinID, isMerged: !!item.isMerged },
              { transaction: t }
            )
            await maybeTouchProduct(
              row.get('sourceBinID') as string | null,
              item.productCode
            )
            remaining = 0
            matched = true
            break
          }
        }
        if (matched) continue

        // 2) 再找两条之和刚好等于 remaining 的
        outer: for (let i = 0; i < openRows.length; i++) {
          const qi = (openRows[i].get('quantity') as number) ?? 0
          for (let j = i + 1; j < openRows.length; j++) {
            const qj = (openRows[j].get('quantity') as number) ?? 0
            if (qi + qj === remaining) {
              await openRows[i].update(
                { destinationBinID: destBinID },
                { transaction: t }
              )
              await openRows[j].update(
                { destinationBinID: destBinID },
                { transaction: t }
              )
              await maybeTouchProduct(
                openRows[i].get('sourceBinID') as string | null,
                item.productCode
              )
              await maybeTouchProduct(
                openRows[j].get('sourceBinID') as string | null,
                item.productCode
              )
              remaining = 0
              matched = true
              break outer
            }
          }
        }
        if (matched) continue

        for (const row of openRows) {
          if (remaining <= 0) break
          const openQty = (row.get('quantity') as number) ?? 0
          const sourceBinID = (row.get('sourceBinID') as string | null) ?? null
          const sessionID = (row.get('sessionID') as string) ?? uuidv4()

          if (openQty <= remaining) {
            await row.update(
              { destinationBinID: destBinID },
              { transaction: t }
            )
            await maybeTouchProduct(sourceBinID, item.productCode)
            remaining -= openQty
          } else {
            await row.update(
              { quantity: openQty - remaining },
              { transaction: t }
            )
            await Log.create(
              {
                productCode: item.productCode,
                quantity: remaining,
                sourceBinID,
                destinationBinID: destBinID,
                accountID: params.accountID,
                sessionID
              },
              { transaction: t }
            )
            await maybeTouchProduct(sourceBinID, item.productCode)
            remaining = 0
          }
        }
      }

      await t.commit()
    } catch (err: any) {
      await t.rollback()
      console.warn(
        '[log.silent] fulfillLogsOnUnload tx rollback:',
        err?.message
      )
    }
  } catch (e: any) {
    console.warn('[log.silent] fulfillLogsOnUnload skip:', e?.message)
  }
}

type SafeWhere = WhereOptions & {
  [Op.and]?: WhereOptions[]
  [Op.or]?: WhereOptions[]
}

function pushAnd(where: SafeWhere, cond: WhereOptions) {
  if (!where[Op.and]) where[Op.and] = []
  where[Op.and]!.push(cond)
}

function escapeLike(s: string) {
  return s.replace(/[%_]/g, '\\$&')
}

export async function listSessionsEnriched(filter: SessionFilter = {}) {
  const {
    accountID,
    workerName,
    keyword,
    start,
    end,
    productCode,
    sourceBinCode,
    destinationBinCode,
    type,
    limit,
    offset,
    warehouseID
  } = filter

  if (!warehouseID || !String(warehouseID).trim()) {
    return { totalSessions: 0, data: [] }
  }

  const [srcBinModel, dstBinModel] = await Promise.all([
    sourceBinCode ? Bin.findOne({ where: { binCode: sourceBinCode } }) : null,
    destinationBinCode
      ? Bin.findOne({ where: { binCode: destinationBinCode } })
      : null
  ])

  if (sourceBinCode && !srcBinModel) return { totalSessions: 0, data: [] }
  if (destinationBinCode && !dstBinModel) return { totalSessions: 0, data: [] }

  let workerAccountIDs: string[] = []
  if (!accountID && workerName && workerName.trim()) {
    const raw = workerName.trim()
    const tokens = raw.split(/\s+/)
    const noSpace = raw.replace(/\s+/g, '')

    const andTokenConds: WhereOptions[] = tokens.map(tok => ({
      [Op.or]: [
        { firstName: { [Op.iLike]: `%${tok}%` } },
        { lastName: { [Op.iLike]: `%${tok}%` } }
      ]
    }))

    const compactOrList: WhereOptions[] = [
      sqlWhere(
        fn('concat', col('firstName'), col('lastName')),
        Op.iLike,
        `%${noSpace}%`
      ),
      sqlWhere(
        fn('concat', col('lastName'), col('firstName')),
        Op.iLike,
        `%${noSpace}%`
      )
    ]

    const matched = await Account.findAll({
      attributes: ['accountID'],
      where: { [Op.and]: [...andTokenConds, { [Op.or]: compactOrList }] },
      limit: 200
    })
    workerAccountIDs = matched.map(a => String(a.get('accountID')))
    if (!workerAccountIDs.length) return { totalSessions: 0, data: [] }
  }

  let keywordDestBinIDs: string[] = []
  if (keyword && keyword.trim()) {
    const kw = escapeLike(keyword.trim())
    const matchedBins = await Bin.findAll({
      attributes: ['binID'],
      where: { binCode: { [Op.iLike]: `${kw}%` } },
      limit: 200
    })
    keywordDestBinIDs = matchedBins.map(b => String(b.get('binID')))
    if (!keywordDestBinIDs.length) return { totalSessions: 0, data: [] }
  }

  const where: SafeWhere = { warehouseID }

  if (accountID) where.accountID = accountID
  else if (workerAccountIDs.length)
    pushAnd(where, { accountID: { [Op.in]: workerAccountIDs } })

  if (productCode) where.productCode = productCode
  if (srcBinModel?.binID) where.sourceBinID = srcBinModel.binID
  if (dstBinModel?.binID) where.destinationBinID = dstBinModel.binID

  if (start || end) {
    const range: any = {}
    if (start) range[Op.gte] = new Date(start)
    if (end) range[Op.lte] = new Date(end)
    where.createdAt = range
  }

  if (keywordDestBinIDs.length)
    pushAnd(where, { destinationBinID: { [Op.in]: keywordDestBinIDs } })

  const logs = await Log.findAll({ where, order: [['createdAt', 'DESC']] })
  if (!logs.length) return { totalSessions: 0, data: [] }

  const srcIDs = new Set<string>(),
    dstIDs = new Set<string>(),
    accIDs = new Set<string>()
  for (const l of logs) {
    const s = l.get('sourceBinID') as string | null
    const d = l.get('destinationBinID') as string | null
    const a = l.get('accountID') as string
    if (s) srcIDs.add(s)
    if (d) dstIDs.add(d)
    if (a) accIDs.add(a)
  }

  const [srcBins, dstBins, accounts] = await Promise.all([
    Bin.findAll({
      attributes: ['binID', 'binCode', 'type'],
      where: { binID: Array.from(srcIDs) }
    }),
    Bin.findAll({
      attributes: ['binID', 'binCode', 'type'],
      where: { binID: Array.from(dstIDs) }
    }),
    Account.findAll({
      attributes: ['accountID', 'firstName', 'lastName', 'email'],
      where: { accountID: Array.from(accIDs) }
    })
  ])

  const srcCodeMap = new Map(
    srcBins.map(b => [String(b.get('binID')), String(b.get('binCode'))])
  )
  const dstCodeMap = new Map(
    dstBins.map(b => [String(b.get('binID')), String(b.get('binCode'))])
  )
  const dstTypeMap = new Map(
    dstBins.map(b => [
      String(b.get('binID')),
      (b.get('type') as string) ?? null
    ])
  )
  const accMap = new Map(
    accounts.map(a => {
      const first = a.get('firstName') as string
      const last = a.get('lastName') as string
      const email = a.get('email') as string
      return [
        String(a.get('accountID')),
        first || last ? `${first} ${last}`.trim() : email
      ]
    })
  )

  const sessions = new Map<string, Group>()
  for (const l of logs) {
    const raw = l.toJSON() as LogRow
    const sessionID = String(raw.sessionID)
    const accountIDVal = String(raw.accountID)
    const sourceBinID = raw.sourceBinID
    const destBinID = raw.destinationBinID
    const srcCode = sourceBinID ? srcCodeMap.get(sourceBinID) ?? null : null
    const dstCode = destBinID ? dstCodeMap.get(destBinID) ?? null : null
    const dstType = destBinID ? dstTypeMap.get(destBinID) ?? null : null

    if (type === 'PICK_UP' && dstType !== 'PICK_UP') continue
    if (type === 'INVENTORY' && dstType === 'PICK_UP') continue

    const createdAt = new Date(raw.createdAt)
    const updatedAt = new Date(raw.updatedAt)
    if (!sessions.has(sessionID)) {
      sessions.set(sessionID, {
        sessionID,
        accountID: accountIDVal,
        accountName: accMap.get(accountIDVal) ?? null,
        startedAt: createdAt,
        lastUpdatedAt: updatedAt,
        isCompleted: !!destBinID,
        destinations: []
      })
    }

    const g = sessions.get(sessionID)!
    if (createdAt < g.startedAt) g.startedAt = createdAt
    if (updatedAt > g.lastUpdatedAt) g.lastUpdatedAt = updatedAt
    if (!destBinID) g.isCompleted = false

    const key = destBinID ?? '__OPEN__'
    let dest = g.destinations.find(
      d => (d.destinationBinID ?? '__OPEN__') === key
    )
    if (!dest) {
      dest = {
        destinationBinID: destBinID,
        destinationBinCode: dstCode,
        totalQuantity: 0,
        items: []
      }
      g.destinations.push(dest)
    }

    dest.items.push({
      logID: raw.logID,
      productCode: raw.productCode,
      quantity: raw.quantity,
      isMerged: raw.isMerged,
      sourceBinID,
      sourceBinCode: srcCode,
      destinationBinID: destBinID,
      destinationBinCode: dstCode,
      createdAt,
      updatedAt
    })
    dest.totalQuantity += Number(raw.quantity)
  }

  const allSessions = Array.from(sessions.values()).map(g => ({
    ...g,
    destinations: g.destinations.map(d => ({
      ...d,
      items: d.items.sort((a, b) => +a.createdAt - +b.createdAt)
    }))
  }))

  const totalSessions = allSessions.length
  const startIndex = offset ?? 0
  const endIndex = limit ? startIndex + limit : undefined
  return {
    totalSessions,
    data: limit ? allSessions.slice(startIndex, endIndex) : allSessions
  }
}
