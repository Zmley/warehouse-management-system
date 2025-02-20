import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

export interface UserAttributes {
  id?: string;
  cognito_id: string;
  email: string;
  role: "admin" | "transport-worker" | "picker";
  firstName?: string; // 新增
  lastName?: string;  // 新增
  created_at?: Date;
  updated_at?: Date;
}

export class User extends Model<UserAttributes> implements UserAttributes {
  public id!: string;
  public cognito_id!: string;
  public email!: string;
  public role!: "admin" | "transport-worker" | "picker";
  public firstName!: string; // 新增
  public lastName!: string;  // 新增
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cognito_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    role: {
      type: DataTypes.ENUM("admin", "transport-worker", "picker"),
      allowNull: false,
    },
    firstName: { // 新增
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: { // 新增
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    underscored: true, // 使用下划线命名约定
  }
);

export default User;