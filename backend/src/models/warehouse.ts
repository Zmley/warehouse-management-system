import { DataTypes, Model } from "sequelize";
import { sequelize } from "../configs/db";

export class warehouse extends Model {
  public warehouseID!: string;
  public warehouseCode!: string;
}

warehouse.init(
  {
    warehouseID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    warehouseCode: {
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