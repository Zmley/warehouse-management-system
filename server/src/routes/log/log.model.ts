import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from 'config/db'
import Bin from 'routes/bins/bin.model'
import Account from 'routes/accounts/accounts.model'
import Product from 'routes/products/product.model'

export interface LogAttributes {
  logID: string
  productCode: string
  quantity: number
  sourceBinID: string | null
  destinationBinID: string | null
  accountID: string
  sessionID: string | null
  isMerged: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type LogCreationAttributes = Optional<
  LogAttributes,
  'logID' | 'sessionID' | 'isMerged' | 'createdAt' | 'updatedAt'
>

export class Log
  extends Model<LogAttributes, LogCreationAttributes>
  implements LogAttributes
{
  public logID!: string
  public productCode!: string
  public quantity!: number
  public sourceBinID!: string | null
  public destinationBinID!: string | null
  public accountID!: string
  public sessionID!: string | null
  public isMerged!: boolean
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Log.init(
  {
    logID: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    productCode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 }
    },
    sourceBinID: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'bin', key: 'binID' }
    },
    destinationBinID: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'bin', key: 'binID' }
    },
    accountID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'account', key: 'accountID' }
    },
    sessionID: {
      type: DataTypes.UUID,
      allowNull: true
    },
    isMerged: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'log',
    timestamps: true,
    indexes: [
      { fields: ['accountID'] },
      { fields: ['sessionID'] },
      { fields: ['productCode', 'createdAt'] }
    ]
  }
)

Log.belongsTo(Bin, {
  foreignKey: 'sourceBinID',
  as: 'sourceBin',
  targetKey: 'binID'
})
Log.belongsTo(Bin, {
  foreignKey: 'destinationBinID',
  as: 'destinationBin',
  targetKey: 'binID'
})
Log.belongsTo(Account, { foreignKey: 'accountID', as: 'account' })
Log.belongsTo(Product, {
  foreignKey: 'productCode',
  targetKey: 'productCode',
  as: 'product'
})

export default Log
