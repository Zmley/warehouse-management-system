import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db"; // 确保你有 Sequelize 连接配置

export interface UserAttributes {
  id?: string;
  cognito_id: string;
  email: string;
  role: "admin" | "transport-worker" | "picker";
  created_at?: Date;
  updated_at?: Date;
}

export class User extends Model<UserAttributes> implements UserAttributes {
  public id!: string;
  public cognito_id!: string;
  public email!: string;
  public role!: "admin" | "transport-worker" | "picker";
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
    timestamps: true, // 自动管理 created_at 和 updated_at
  }
);

export default User;