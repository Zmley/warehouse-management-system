import Joi from 'joi'
import * as dotenv from 'dotenv'

dotenv.config({ path: `.env` })

const envsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'integration', 'development'),
    PORT: Joi.number().default(3000),
    API_KEY_TOKEN: Joi.string(),
    DB_HOST: Joi.string().required(),
    DB_HOSTING: Joi.string(),
    DB_USER: Joi.string(),
    DB_PASSWORD: Joi.string(),
    AWS_REGION: Joi.string(),
    COGNITO_USER_POOL_ID: Joi.string(),
    COGNITO_CLIENT_ID: Joi.string(),
    DB_SSL: Joi.string().valid('true', 'false').default('false')
  })
  .unknown(true)

const { value: envVars, error } = envsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env)

if (error) {
  throw new Error(
    `Config validation error: ${error.message}. \n
     This app requires env variables to work properly. If you run app locally use docker-compose`
  )
}
// map env vars and make it visible outside module
export default {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  dbHost: envVars.DB_HOST,
  xApiKey: envVars.API_KEY_TOKEN,
  dbName: envVars.DB_NAME,
  dbUser: envVars.DB_USER,
  dbPassword: envVars.DB_PASSWORD,
  awsRegion: envVars.AWS_REGION,
  cognitoUserPoolId: envVars.COGNITO_USER_POOL_ID,
  cognitoClientId: envVars.COGNITO_CLIENT_ID,
  dbSsl: envVars.DB_SSL === 'true'
}
