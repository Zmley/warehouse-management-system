import { DataTypes, Model } from "sequelize";
import { sequelize } from "../configs/db";

export class bin extends Model {
  public binID!: string;
  public warehouseCode!: string;
  public binCode!: string;
  public type!: "PICK_UP" | "INVENTORY" | "UNLOAD" | "CART"; // ✅ 添加 `type` 字段
  public productID!: string | null; // ✅ 添加 `productID`，允许为 null
}

bin.init(
  {
    binID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    warehouseCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    binCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM('PICK_UP', 'INVENTORY', 'CART'),

      allowNull: false,
      defaultValue: "INVENTORY",
    },
    productID: {
      type: DataTypes.STRING,
      allowNull: true, 
    },
  },
  {
    sequelize,
    tableName: "bin",
    timestamps: true,
  }
);

export default bin;