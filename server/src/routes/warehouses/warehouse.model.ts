import { Model, DataTypes } from 'sequelize'
import { sequelize } from 'config/db'

export class Warehouse extends Model {
  public warehouseID!: string
  public warehouseCode!: string
  public createdAt!: Date
  public updatedAt!: Date
}

Warehouse.init(
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
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'warehouse',
    timestamps: true
  }
)

export default Warehouse
