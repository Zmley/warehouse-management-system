import { DataTypes, Model } from "sequelize";
import { sequelize } from "../configs/db";
import bin from "./bin";

export class inventory extends Model {
  public inventoryID!: string;
  public binID!: string;
  public productID!: string;
  public quantity!: number;
  public createdAt!: Date;
  public updatedAt!: Date | null;
}

inventory.init(
  {
    inventoryID: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    binID: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    productID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "inventory",
    timestamps: true,
  }
);

inventory.belongsTo(bin,
  {
    foreignKey: "binID"
  }
)

export default inventory;