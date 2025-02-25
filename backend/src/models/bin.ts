import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

export class Bin extends Model {
  public ID!: string;
  public warehouseID!: string;
  public binID!: string;
  public emptyStatus!: boolean;
}

Bin.init(
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
    },
    binID: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    emptyStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "Bins",
    timestamps: true,
  }
);

export default Bin;