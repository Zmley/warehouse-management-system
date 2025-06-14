import Joi from 'joi'
import * as dotenv from 'dotenv'

dotenv.config({ path: `.env` })

// All env variables used by the app should be defined in this file.

// To define new env:
// 1. Add env variable to .env.local file;
// 2. Provide validation rules for your env in envsSchema;
// 3. Make it visible outside of this module in export section;
// 4. Access your env variable only via config file.
// Do not use process.env object outside of this file.

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
    COGNITO_CLIENT_ID: Joi.string()
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
  cognitoClientId: envVars.COGNITO_CLIENT_ID
}
