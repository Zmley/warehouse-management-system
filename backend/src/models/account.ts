import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../configs/db'

export class account extends Model {
  public accountID!: string
  public email!: string
  public role!: 'ADMIN' | 'TRANSPORT_WORKER' | 'PICKER' | 'SUPER_ADMIN'
  public firstName!: string
  public lastName!: string
  public carID!: string | null
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

account.init(
  {
    accountID: {
      type: DataTypes.STRING,
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
        'ADMIN',
        'PICKER',
        'TRANSPORT_WORKER',
        'SUPER_ADMIN'
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
    carID: {
      type: DataTypes.STRING,
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

export default account
