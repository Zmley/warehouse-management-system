import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

export interface InventoryAttributes {
  id?: string;
  warehouse_code: string;
  bin_code: string;
  product_code: string;
  quantity: number;
  bin_qr_code: string;
  updated_at?: Date;
}

export class Inventory extends Model<InventoryAttributes> implements InventoryAttributes {
  public id!: string;
  public warehouse_code!: string;
  public bin_code!: string;
  public product_code!: string;
  public quantity!: number;
  public bin_qr_code!: string;
  public readonly updated_at!: Date;
}

Inventory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    warehouse_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bin_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    product_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    bin_qr_code: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "inventory",
    timestamps: true,
    underscored: true,
  }
);

export default Inventory;