import { DataTypes, Model } from 'sequelize'
import { sequelize } from 'config/db'
import { TaskStatus } from 'constants/index'
import Task from 'routes/tasks/task.model'
import Warehouse from 'routes/warehouses/warehouse.model'
import Bin from 'routes/bins/bin.model'
import Account from 'routes/accounts/accounts.model'

export class Transfer extends Model {
  public transferID!: string
  public taskID!: string | null
  public sourceWarehouseID!: string
  public destinationWarehouseID!: string
  public sourceBinID!: string | null
  public destinationBinID!: string | null
  public productCode!: string
  public quantity!: number
  public status!: TaskStatus | string
  public createdBy!: string
  public createdAt!: Date
  public updatedAt!: Date | null
}

Transfer.init(
  {
    transferID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    taskID: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'task', key: 'taskID' },
      onDelete: 'SET NULL'
    },
    sourceWarehouseID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'warehouse', key: 'warehouseID' },
      onDelete: 'CASCADE'
    },
    destinationWarehouseID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'warehouse', key: 'warehouseID' },
      onDelete: 'CASCADE'
    },
    sourceBinID: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'bin', key: 'binID' },
      onDelete: 'SET NULL'
    },
    destinationBinID: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'bin', key: 'binID' },
      onDelete: 'SET NULL'
    },
    productCode: {
      type: DataTypes.STRING,
      allowNull: false
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
      allowNull: false,
      defaultValue: TaskStatus.PENDING
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'account', key: 'accountID' },
      onDelete: 'CASCADE'
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
    tableName: 'transfers',
    timestamps: true
  }
)

Transfer.belongsTo(Task, { foreignKey: 'taskID', as: 'task' })

Transfer.belongsTo(Warehouse, {
  foreignKey: 'sourceWarehouseID',
  as: 'sourceWarehouse'
})
Transfer.belongsTo(Warehouse, {
  foreignKey: 'destinationWarehouseID',
  as: 'destinationWarehouse'
})

Transfer.belongsTo(Bin, { foreignKey: 'sourceBinID', as: 'sourceBin' })
Transfer.belongsTo(Bin, {
  foreignKey: 'destinationBinID',
  as: 'destinationBin'
})

Transfer.belongsTo(Account, { foreignKey: 'createdBy', as: 'creator' })

export default Transfer
