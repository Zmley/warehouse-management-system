import { DataTypes, Model } from 'sequelize'
import { sequelize } from 'config/db'

export class Product extends Model {
  public productID!: string
  public productCode!: string
  public barCode!: string
  public boxType!: string
  public createdAt!: Date
}

Product.init(
  {
    productID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    productCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    barCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    boxType: {
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
    tableName: 'product',
    timestamps: true
  }
)

export default Product
