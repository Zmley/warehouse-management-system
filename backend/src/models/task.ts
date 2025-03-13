import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

export class Task extends Model {
  public taskID!: string;
  public sourceBinID!: string;
  public destinationBinID!: string;
  public accountID!: string;
  public productID!: string;

  public creatorID!: string;

  
  public status!: "pending" | "inProgress" | "completed" | "cancel";
  public createdAt!: Date;
  public updatedAt!: Date | null;
}

Task.init(
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

    creatorID: {
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
    tableName: "Tasks",
    timestamps: true,
  }
);

export default Task;