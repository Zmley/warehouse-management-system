import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

export class Task extends Model {
  public ID!: string;
  public sourceBinID!: string;
  public destinationBinList!: string;
  public assignedUserID!: string;
  public productID!: string;
  public status!: "pending" | "inProgress" | "completed" | "cancel";
  public createdAt!: Date;
  public completedAt!: Date | null;
}

Task.init(
  {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    sourceBinID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    destinationBin: {
      type: DataTypes.STRING,
      allowNull: false,
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
    completedAt: {
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