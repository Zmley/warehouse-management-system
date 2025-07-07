import { Sequelize } from 'sequelize'
import env from 'config/config'

const shouldUseSSL = process.env.DB_SSL === 'true'

export const sequelize = new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
  host: env.dbHost,
  port: 5432,
  dialect: 'postgres',
  dialectOptions: shouldUseSSL
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    : {}
})

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.')
  })
  .catch(error => {
    console.error('Unable to connect to the database: ', error)
  })
