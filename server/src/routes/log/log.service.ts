import Log from 'routes/log/log.model'
import Bin from 'routes/bins/bin.model'
import { Op, Transaction, WhereOptions } from 'sequelize'
import { v4 as uuidv4 } from 'uuid'
import { fn, col, where as sqlWhere } from 'sequelize'
import Account from 'routes/accounts/accounts.model'

type Item = {
  productCode: string
  quantity: number
  isMerged?: boolean
}

async function toBinIDByCode(binCode?: string | null): Promise<string | null> {
  if (!binCode) return null
  try {
    const bin = await Bin.findOne({ where: { binCode } })
    return bin?.binID ?? null
  } catch {
    return null
  }
}

function normalizeItems(items?: Item[]): Item[] {
  return (items || []).filter(
    x => !!x?.productCode && Number.isInteger(x?.quantity) && x.quantity > 0
  )
}

export async function createOpenLogsOnLoad(params: {
  accountID: string
  sourceBinCode?: string | null
  items: Item[]
}) {
  try {
    const sourceBinID = await toBinIDByCode(params.sourceBinCode || null)

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
      sourceBinID: sourceBinID ?? null,
      destinationBinID: null,
      accountID: params.accountID,
      sessionID,
      isMerged: !!x.isMerged
    }))

    if (rows.length) await Log.bulkCreate(rows)
  } catch (e) {
    console.warn('[log.silent] createOpenLogsOnLoad skip:', e?.message)
  }
}

export async function fulfillLogsOnUnload(params: {
  accountID: string
  destinationBinCode: string
  items: Item[]
}) {
  try {
    const destBinID = await toBinIDByCode(params.destinationBinCode)
    if (!destBinID) return

    const wanted = normalizeItems(params.items)
    if (!wanted.length) return

    const t: Transaction = await Log.sequelize!.transaction()
    try {
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
            remaining = 0
            matched = true
            break
          }
        }
        if (matched) continue

        outer: for (let i = 0; i < openRows.length; i++) {
          const qi = (openRows[i].get('quantity') as number) ?? 0
          for (let j = i + 1; j < openRows.length; j++) {
            const qj = (openRows[j].get('quantity') as number) ?? 0
            if (qi + qj === remaining) {
              await openRows[i].update(
                { destinationBinID: destBinID, isMerged: !!item.isMerged },
                { transaction: t }
              )
              await openRows[j].update(
                { destinationBinID: destBinID, isMerged: !!item.isMerged },
                { transaction: t }
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
          const wasMerged = !!row.get('isMerged')

          if (openQty <= remaining) {
            await row.update(
              { destinationBinID: destBinID, isMerged: !!item.isMerged },
              { transaction: t }
            )
            remaining -= openQty
          } else {
            await row.update(
              { quantity: openQty - remaining, isMerged: wasMerged },
              { transaction: t }
            )

            await Log.create(
              {
                productCode: item.productCode,
                quantity: remaining,
                sourceBinID,
                destinationBinID: destBinID,
                accountID: params.accountID,
                sessionID,
                isMerged: !!item.isMerged
              },
              { transaction: t }
            )

            remaining = 0
          }
        }
      }

      await t.commit()
    } catch (err) {
      await t.rollback()
      console.warn(
        '[log.silent] fulfillLogsOnUnload tx rollback:',
        err?.message
      )
    }
  } catch (e) {
    console.warn('[log.silent] fulfillLogsOnUnload skip:', e?.message)
  }
}

export type SessionFilter = {
  accountID?: string
  workerName?: string
  keyword?: string
  start?: string | Date
  end?: string | Date
  productCode?: string
  sourceBinCode?: string
  destinationBinCode?: string
  type?: 'INVENTORY' | 'PICK_UP'
  limit?: number
  offset?: number
}

type SafeWhere = WhereOptions & {
  [Op.and]?: WhereOptions[]
  [Op.or]?: WhereOptions[]
}

type LogRow = {
  logID: string
  productCode: string
  quantity: number
  sourceBinID: string | null
  destinationBinID: string | null
  accountID: string
  sessionID: string
  isMerged: boolean
  createdAt: Date | string
  updatedAt: Date | string
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
    offset
  } = filter

  const [srcBinModel, dstBinModel] = await Promise.all([
    sourceBinCode ? Bin.findOne({ where: { binCode: sourceBinCode } }) : null,
    destinationBinCode
      ? Bin.findOne({ where: { binCode: destinationBinCode } })
      : null
  ])

  if (sourceBinCode && !srcBinModel) {
    return { totalSessions: 0, data: [] as unknown[] }
  }
  if (destinationBinCode && !dstBinModel) {
    return { totalSessions: 0, data: [] as unknown[] }
  }

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

    const nameWhere: WhereOptions = {
      [Op.and]: [...andTokenConds, { [Op.or]: compactOrList }]
    }

    const matched = await Account.findAll({
      attributes: ['accountID'],
      where: nameWhere,
      limit: 200
    })
    workerAccountIDs = matched.map(a => String(a.get('accountID')))

    if (workerAccountIDs.length === 0) {
      return { totalSessions: 0, data: [] as unknown[] }
    }
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

    if (keywordDestBinIDs.length === 0) {
      return { totalSessions: 0, data: [] as unknown[] }
    }
  }

  const where: SafeWhere = {}

  if (accountID) {
    where.accountID = accountID
  } else if (workerAccountIDs.length) {
    pushAnd(where, { accountID: { [Op.in]: workerAccountIDs } })
  }

  if (productCode) where.productCode = productCode
  if (srcBinModel?.binID) where.sourceBinID = srcBinModel.binID
  if (dstBinModel?.binID) where.destinationBinID = dstBinModel.binID

  if (start || end) {
    const range: { [Op.gte]?: Date; [Op.lte]?: Date } = {}
    if (start) range[Op.gte] = new Date(start)
    if (end) range[Op.lte] = new Date(end)
    where.createdAt = range
  }

  if (keywordDestBinIDs.length) {
    pushAnd(where, { destinationBinID: { [Op.in]: keywordDestBinIDs } })
  }

  const logs = await Log.findAll({
    where,
    order: [['createdAt', 'DESC']]
  })

  if (logs.length === 0) {
    return { totalSessions: 0, data: [] as unknown[] }
  }

  const srcIDs = new Set<string>()
  const dstIDs = new Set<string>()
  const accIDs = new Set<string>()

  for (const l of logs) {
    const s = (l.get('sourceBinID') as string | null) ?? null
    const d = (l.get('destinationBinID') as string | null) ?? null
    const a = (l.get('accountID') as string) ?? ''
    if (s) srcIDs.add(s)
    if (d) dstIDs.add(d)
    if (a) accIDs.add(a)
  }

  const [srcBins, dstBins, accounts] = await Promise.all([
    srcIDs.size
      ? Bin.findAll({
          attributes: ['binID', 'binCode', 'type'],
          where: { binID: Array.from(srcIDs) }
        })
      : Promise.resolve([]),
    dstIDs.size
      ? Bin.findAll({
          attributes: ['binID', 'binCode', 'type'],
          where: { binID: Array.from(dstIDs) }
        })
      : Promise.resolve([]),
    accIDs.size
      ? Account.findAll({
          attributes: ['accountID', 'firstName', 'lastName', 'email'],
          where: { accountID: Array.from(accIDs) }
        })
      : Promise.resolve([])
  ])

  const srcCodeMap = new Map<string, string>(
    srcBins.map(
      b =>
        [String(b.get('binID')), String(b.get('binCode'))] as [string, string]
    )
  )
  const dstCodeMap = new Map<string, string>(
    dstBins.map(
      b =>
        [String(b.get('binID')), String(b.get('binCode'))] as [string, string]
    )
  )
  const dstTypeMap = new Map<string, string | null>(
    dstBins.map(
      b =>
        [String(b.get('binID')), (b.get('type') as string) ?? null] as [
          string,
          string | null
        ]
    )
  )
  const accMap = new Map<string, string>(
    accounts.map(a => {
      const first = (a.get('firstName') as string) ?? ''
      const last = (a.get('lastName') as string) ?? ''
      const email = (a.get('email') as string) ?? ''
      const full = `${first}${last ? ' ' + last : ''}`.trim()
      return [String(a.get('accountID')), full || email] as [string, string]
    })
  )

  type Group = {
    sessionID: string
    accountID: string
    accountName: string | null
    startedAt: Date
    lastUpdatedAt: Date
    isCompleted: boolean
    destinations: Array<{
      destinationBinID: string | null
      destinationBinCode: string | null
      totalQuantity: number
      items: Array<{
        logID: string
        productCode: string
        quantity: number
        isMerged: boolean
        sourceBinID: string | null
        sourceBinCode: string | null
        destinationBinID: string | null
        destinationBinCode: string | null
        createdAt: Date
        updatedAt: Date
      }>
    }>
  }

  const sessions = new Map<string, Group>()

  for (const l of logs) {
    const raw = l.toJSON() as unknown as LogRow

    const sessionID = String(raw.sessionID)
    const accountIDVal = String(raw.accountID)
    const sourceBinID = (raw.sourceBinID ?? null) as string | null
    const destBinID = (raw.destinationBinID ?? null) as string | null

    const srcCode = sourceBinID ? srcCodeMap.get(sourceBinID) ?? null : null
    const dstCode = destBinID ? dstCodeMap.get(destBinID) ?? null : null
    const dstType = destBinID ? dstTypeMap.get(destBinID) ?? null : null

    if (type === 'PICK_UP') {
      if (dstType !== 'PICK_UP') continue
    } else if (type === 'INVENTORY') {
      if (dstType === 'PICK_UP') continue
    }

    const createdAt = new Date(raw.createdAt)
    const updatedAt = new Date(raw.updatedAt)

    if (!sessions.has(sessionID)) {
      sessions.set(sessionID, {
        sessionID,
        accountID: accountIDVal,
        accountName: accMap.get(accountIDVal) ?? null,
        startedAt: createdAt,
        lastUpdatedAt: updatedAt,
        isCompleted: destBinID !== null,
        destinations: []
      })
    }

    const group = sessions.get(sessionID)!
    if (createdAt < group.startedAt) group.startedAt = createdAt
    if (updatedAt > group.lastUpdatedAt) group.lastUpdatedAt = updatedAt
    if (destBinID === null) group.isCompleted = false

    const key = destBinID ?? '__OPEN__'
    let dest = group.destinations.find(
      d => (d.destinationBinID ?? '__OPEN__') === key
    )
    if (!dest) {
      dest = {
        destinationBinID: destBinID,
        destinationBinCode: dstCode,
        totalQuantity: 0,
        items: []
      }
      group.destinations.push(dest)
    }

    dest.items.push({
      logID: String(raw.logID),
      productCode: String(raw.productCode),
      quantity: Number(raw.quantity) || 0,
      isMerged: Boolean(raw.isMerged),
      sourceBinID,
      sourceBinCode: srcCode,
      destinationBinID: destBinID,
      destinationBinCode: dstCode,
      createdAt,
      updatedAt
    })
    dest.totalQuantity += Number(raw.quantity) || 0
  }

  const allSessions = Array.from(sessions.values()).map(g => ({
    ...g,
    destinations: g.destinations
      .map(d => ({
        ...d,
        items: d.items.sort((a, b) => +a.createdAt - +b.createdAt)
      }))
      .sort((a, b) => {
        const ka = a.destinationBinID ? 1 : 0
        const kb = b.destinationBinID ? 1 : 0
        if (ka !== kb) return ka - kb
        return (a.destinationBinCode || '').localeCompare(
          b.destinationBinCode || ''
        )
      })
  }))

  allSessions.sort((a, b) => +b.lastUpdatedAt - +a.lastUpdatedAt)

  const totalSessions = allSessions.length
  const startIndex = typeof offset === 'number' ? offset : 0
  const endIndex = typeof limit === 'number' ? startIndex + limit : undefined
  const sliced =
    typeof limit === 'number'
      ? allSessions.slice(startIndex, endIndex)
      : allSessions

  return { totalSessions, data: sliced }
}
