import { Express } from 'express'
import authRoutes from './routes/account/accounts.router'

export const setupApiRoutes = (app: Express) => {
  app.use('/api/auth', authRoutes)
}
