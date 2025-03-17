import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../db/db'

export class warehouse extends Model {
  public warehouseID!: string
  public warehouseCode!: string
  public createdAt!: Date
  public updatedAt!: Date | null
}

warehouse.init(
  {
    warehouseID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    warehouseCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
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
    tableName: 'warehouse',
    timestamps: true
  }
)

export default warehouse
