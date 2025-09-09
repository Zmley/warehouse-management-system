import express, { Application } from 'express'
import httpContext from 'express-http-context'
import cors from 'cors'
import httpLogger from 'utils/httpLogger'
import errorHandling from 'middlewares/errorHandling.middleware'
import uniqueReqId from 'middlewares/uniqueReqId.middleware'
import http404 from 'routes/404/404.router'
import api from 'api'
import { setupAssociations } from 'models/associations'
import { errors as celebrateErrors } from 'celebrate'

const app: Application = express()

const corsOrigins = [
  process.env.CORS_ORIGIN_ADMIN_LOCAL,
  process.env.CORS_ORIGIN_ADMIN_PROD,
  process.env.CORS_ORIGIN_ADMIN_PROD_ZMLEY,
  process.env.CORS_ORIGIN_WORKER_LOCAL,
  process.env.CORS_ORIGIN_WORKER_PROD,
  process.env.CORS_ORIGIN_WORKER_PROD_ZMLEY,
  'http://192.168.4.244:4100'
].filter(Boolean)

const corsOptions = {
  origin: corsOrigins,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 200
}

setupAssociations()

app.use(cors(corsOptions))
app.use(httpContext.middleware)
app.use(httpLogger.successHandler)
app.use(httpLogger.errorHandler)
app.use(uniqueReqId)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/api', api)

app.use(celebrateErrors())

app.use(http404)
app.use(errorHandling)

export default app
