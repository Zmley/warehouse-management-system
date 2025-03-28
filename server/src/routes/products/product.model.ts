import { DataTypes, Model } from 'sequelize'
import { sequelize } from 'config/db'

export class Product extends Model {
  public productID!: string
  public productCode!: string
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
    }
  },
  {
    sequelize,
    tableName: 'product',
    timestamps: true
  }
)

export default Product
