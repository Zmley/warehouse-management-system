import { DataTypes, Model } from 'sequelize'
import { sequelize } from 'config/db'
import Inventory from 'routes/inventory/inventory.model'
import Bin from 'routes/bins/bin.model'
import { TaskStatus } from 'constants/index'
import Account from 'routes/accounts/accounts.model'

export class Task extends Model {
  public taskID!: string
  public sourceBinID!: string
  public destinationBinID!: string
  public accepterID!: string
  public creatorID!: string
  public productCode!: string
  public quantity!: number
  public status!: TaskStatus | string
  public createdAt!: Date
  public updatedAt!: Date | null

  public readonly sourceBin?: Bin
  public readonly destinationBin?: Bin
}

Task.init(
  {
    taskID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    sourceBinID: {
      type: DataTypes.UUID,
      allowNull: true
    },
    destinationBinID: {
      type: DataTypes.UUID,
      allowNull: true
    },
    creatorID: {
      type: DataTypes.UUID,
      allowNull: true
    },
    accepterID: {
      type: DataTypes.UUID,
      allowNull: true
    },
    productCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM(
        TaskStatus.PENDING,
        TaskStatus.IN_PROCESS,
        TaskStatus.COMPLETED,
        TaskStatus.CANCELED
      ),
      allowNull: false
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
    tableName: 'task',
    timestamps: true
  }
)

Task.hasMany(Inventory, {
  foreignKey: 'productCode',
  sourceKey: 'productCode'
})

Task.belongsTo(Bin, {
  foreignKey: 'sourceBinID',
  as: 'sourceBin',
  targetKey: 'binID'
})

Task.belongsTo(Bin, {
  foreignKey: 'destinationBinID',
  as: 'destinationBin',
  targetKey: 'binID'
})

Task.hasMany(Inventory, {
  foreignKey: 'productCode',
  sourceKey: 'productCode',
  as: 'inventories'
})

Task.belongsTo(Account, {
  foreignKey: 'accepterID',
  as: 'accepter'
})

Task.belongsTo(Account, { as: 'creator', foreignKey: 'creatorID' })

Task.hasMany(Inventory, {
  foreignKey: 'productCode',
  sourceKey: 'productCode',
  as: 'otherInventories'
})

export default Task
