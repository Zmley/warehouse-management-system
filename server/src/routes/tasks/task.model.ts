import { DataTypes, Model } from 'sequelize'
import { sequelize } from 'config/db'
import Inventory from '../inventory/inventory.model'

export class Task extends Model {
  public taskID!: string
  public sourceBinID!: string
  public destinationBinID!: string
  public accepterID!: string
  public productCode!: string
  public status!: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'CANCEL'
  public createdAt!: Date
  public updatedAt!: Date | null
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
    status: {
      type: DataTypes.ENUM('PENDING', 'IN_PROCESS', 'COMPLETED', 'CANCELED'),
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true
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

export default Task
