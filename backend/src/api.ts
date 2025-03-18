import { Express } from 'express'
import authRoutes from './routes/account/accounts.router'

export const authApi = (app: Express) => {
  app.use('/api/auth', authRoutes)
}
