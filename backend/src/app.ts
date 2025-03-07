import express from 'express'
import cors from 'cors'
import authRoutes from './routes/authRoutes'

const app = express()

app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true
  })
)
app.use(express.json())

app.use('/api/auth', authRoutes)

app.get('/', (req, res) => {
  res.send('Warehouse Management System Backend is running...')
})

export default app
