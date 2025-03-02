import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

// ✅ Bin Model
export class Bin extends Model {
  public binID!: string;
  public warehouseCode!: string;
  public binCode!: string;
  public emptyStatus!: boolean;
}

Bin.init(
  {
    binID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    warehouseCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    binCode: {
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