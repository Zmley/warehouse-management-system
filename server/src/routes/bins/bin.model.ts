import { DataTypes, Model } from 'sequelize'
import { sequelize } from 'config/db'
import { BinType } from 'constants/index'
import Inventory from 'routes/inventory/inventory.model'
import Warehouse from 'routes/warehouses/warehouse.model'

export class Bin extends Model {
  public binID!: string
  public warehouseID!: string
  public binCode!: string
  public type!: BinType
  public defaultProductCodes!: string | null
  public inventories?: Inventory[]
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
      type: DataTypes.ENUM(
        BinType.PICK_UP,
        BinType.INVENTORY,
        BinType.CART,
        BinType.AISLE
      ),
      allowNull: false
    },
    defaultProductCodes: {
      type: DataTypes.STRING,
      allowNull: true
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
    tableName: 'bin',
    timestamps: true
  }
)

Bin.belongsTo(Warehouse, { as: 'warehouse', foreignKey: 'warehouseID' })

export default Bin
