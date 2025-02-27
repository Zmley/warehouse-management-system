import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

export class Task extends Model {
  public ID!: string;
  public warehouseID!: string;
  public sourceBinID!: string;
  public destinationBin!: string;
  public assignedUserID!: string;
  public productID!: string;
  public status!: "pending" | "inProgress" | "completed" | "cancel";
  public createdAt!: Date;
  public updatedAt!: Date | null;
}

Task.init(
  {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    warehouseID: {  // ✅ 添加 warehouseID
      type: DataTypes.STRING,
      allowNull: false,
    },
    sourceBinID: {
      type: DataTypes.STRING,
      allowNull: true, // ✅ 允许为空，防止任务创建时报错
    },
    destinationBin: {
      type: DataTypes.STRING,
      allowNull: true, // ✅ 允许为空，防止任务创建时报错
    },
    assignedUserID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productID: {  // ✅ 添加新的字段
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "inProgress", "completed", "cancel"),
      allowNull: false,
      defaultValue: "pending",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "Tasks",
    timestamps: true,
  }
);

export default Task;