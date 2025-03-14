import { DataTypes, Model } from "sequelize";
import { sequelize } from "../configs/db";

export class task extends Model {
  public taskID!: string;
  public sourceBinID!: string;
  public destinationBinID!: string;
  public accountID!: string;
  public productID!: string;
  public status!: "pending" | "inProgress" | "completed" | "cancel";
  public createdAt!: Date;
  public updatedAt!: Date | null;
}

task.init(
  {
    taskID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    sourceBinID: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    destinationBinID: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountID: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    productID: {
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
    tableName: "task",
    timestamps: true,
  }
);

export default task;