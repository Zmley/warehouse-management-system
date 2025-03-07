import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

export class Warehouse extends Model {
  public ID!: string;
  public warehouseID!: string;
}

Warehouse.init(
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
    tableName: "Warehouses",
    timestamps: true,
  }
);

export default Warehouse;