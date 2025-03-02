import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

// ✅ Inventory Model
export class Inventory extends Model {
  public inventoryID!: string;
  public binID!: string;
  public productID!: string;
  public quantity!: number;
}

Inventory.init(
  {
    inventoryID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
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
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Inventory",
    timestamps: true,
  }
);

export default Inventory;