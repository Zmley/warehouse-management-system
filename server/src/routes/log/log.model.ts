import { DataTypes, Model } from 'sequelize'
import { sequelize } from 'config/db'
import Bin from 'routes/bins/bin.model'
import Account from 'routes/accounts/accounts.model'
import Product from 'routes/products/product.model'

export class Log extends Model {
  public logID!: string
  public productCode!: string
  public quantity!: number
  public sourceBinID!: string | null
  public destinationBinID!: string | null
  public accountID!: string
  public sessionID!: string | null
  public isMerged!: boolean
  public createdAt!: Date
  public updatedAt!: Date
}

Log.init(
  {
    logID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
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
      allowNull: true
    },
    destinationBinID: {
      type: DataTypes.UUID,
      allowNull: true
    },
    accountID: {
      type: DataTypes.UUID,
      allowNull: false
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
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
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

Log.belongsTo(Bin, { foreignKey: 'sourceBinID', as: 'sourceBin' })
Log.belongsTo(Bin, { foreignKey: 'destinationBinID', as: 'destinationBin' })
Log.belongsTo(Account, { foreignKey: 'accountID', as: 'account' })
Log.belongsTo(Product, {
  foreignKey: 'productCode',
  targetKey: 'productCode',
  as: 'product'
})

export default Log
