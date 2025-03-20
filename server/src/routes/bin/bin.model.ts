import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/db'

export class Bin extends Model {
  public binID!: string
  public warehouseID!: string
  public binCode!: string
  public type!: 'PICK_UP' | 'INVENTORY' | 'UNLOAD' | 'CART'
  public productID!: string | null
}

Bin.init(
  {
    binID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    warehouseID: {
      type: DataTypes.UUID,
      allowNull: false
    },
    binCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.ENUM('PICK_UP', 'INVENTORY', 'CART'),
      allowNull: false
    },
    productID: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'bin',
    timestamps: true
  }
)

export default Bin