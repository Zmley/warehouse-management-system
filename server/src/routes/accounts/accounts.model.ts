import { DataTypes, Model } from 'sequelize'
import { sequelize } from 'config/db'
import { UserRole } from 'constants/uerRole'

export class Account extends Model {
  public accountID!: string
  public email!: string
  public role!: UserRole
  public firstName!: string
  public lastName!: string
  public cartID!: string | null
  public warehouseID!: string | null
}

Account.init(
  {
    accountID: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    role: {
      type: DataTypes.ENUM(
        UserRole.ADMIN,
        UserRole.PICKER,
        UserRole.TRANSPORT_WORKER,
        UserRole.SUPER_ADMIN
      ),
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cartID: {
      type: DataTypes.UUID,
      allowNull: true
    },
    warehouseID: {
      type: DataTypes.UUID,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'account',
    timestamps: true
  }
)

export default Account
