import express from 'express'
import cors from 'cors'
import authRoutes from './routes/authRoutes'
import httpLogger from './middlewares/httpLogger'

const httpContext = require('express-http-context')
const app = express()

app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true
  })
)

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))
app.use(httpContext.middleware)
app.use(httpLogger)

app.use(express.json())

app.use('/api/auth', authRoutes)

app.get('/', (req, res) => {
  res.send('Warehouse Management System Backend is running...')
})

export default app
