import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

// ✅ Bin Model
export class Bin extends Model {
  public binID!: string;
  public warehouseCode!: string;
  public binCode!: string;
  public emptyStatus!: boolean;
  public type!: "pick up" | "inventory" | "unload"; // ✅ 添加 `type` 字段
  public productID!: string | null; // ✅ 添加 `productID`，允许为 null
}

Bin.init(
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
    emptyStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    type: {
      type: DataTypes.ENUM("pick up", "inventory", "unload"), // ✅ Enum 类型
      allowNull: false,
      defaultValue: "inventory",
    },
    productID: {
      type: DataTypes.STRING,
      allowNull: true, // ✅ 允许为空
    },
  },
  {
    sequelize,
    tableName: "Bins",
    timestamps: true,
  }
);

export default Bin;