import { DataTypes, Model } from "sequelize";
import { sequelize } from "../configs/db";

export class warehouse extends Model {
  public ID!: string;
  public warehouseID!: string;
}

warehouse.init(
  {
    ID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    warehouseID: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: "warehouse",
    timestamps: true,
  }
);

export default warehouse;