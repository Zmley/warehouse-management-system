import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

export interface UserAttributes {
  accountID: string;
  email: string;
  role: "admin" | "transportWorker" | "picker";
  firstName?: string;
  lastName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Model<UserAttributes> implements UserAttributes {
  public accountID!: string;
  public email!: string;
  public role!: "admin" | "transportWorker" | "picker";
  public firstName!: string;
  public lastName!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    accountID: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    role: {
      type: DataTypes.ENUM("admin", "transportWorker", "picker"),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "Users",
    timestamps: true,
    underscored: false, // ✅ 驼峰命名
  }
);

export default User;