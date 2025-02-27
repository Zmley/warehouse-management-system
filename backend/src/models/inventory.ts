import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

export class Inventory extends Model {
  public ID!: string;
  public warehouseID!: string;
  public binID!: string;
  public productID!: string;
  public quantity!: number
}

Inventory.init(
  {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    warehouseID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    binID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    ownedBy: {
      type: DataTypes.STRING,
      allowNull: false, // ✅ 代表库存的所有者
    },
  },
  {
    sequelize,
    tableName: "Inventory",
    timestamps: true,
  }
);

export default Inventory;