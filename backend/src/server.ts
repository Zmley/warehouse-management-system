import dotenv from 'dotenv'
dotenv.config()

import app from './app'
import { connectDB } from './db/db'

connectDB()
  .then(() => {
    console.log('✅ Database Connected')
  })
  .catch(error => {
    console.error('❌ Database Connection Failed:', error)
  })

const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
})
