import { Sequelize } from 'sequelize'
import { Op } from 'sequelize'
import { WhereOptions } from 'sequelize/types'

export const getOffset = (page: number, limit: number): number => {
  return (page - 1) * limit
}

export const buildProductWhereClause = (keyword?: string): WhereOptions => {
  if (keyword) {
    return {
      productCode: {
        [Op.iLike]: `%${keyword}%`
      }
    }
  }

  return {}
}

export const getTotalQuantitySubquery = (warehouseID: string) => {
  return Sequelize.literal(`(
    SELECT SUM("quantity") 
    FROM "inventory" AS "inventories" 
    INNER JOIN "bin" AS "bin" ON "inventories"."binID" = "bin"."binID"
    WHERE "inventories"."productCode" = "Product"."productCode"
      AND "bin"."warehouseID" = '${warehouseID}'
  )`)
}
