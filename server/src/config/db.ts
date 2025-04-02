import { Sequelize } from 'sequelize'
import env from 'config/config'

console.log(env.dbHost)

export const sequelize = new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
  host: env.dbHost,
  port: 5432,
  dialect: 'postgres',
  logging: false
})

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.')
  })
  .catch(error => {
    console.error('Unable to connect to the database: ', error)
  })
