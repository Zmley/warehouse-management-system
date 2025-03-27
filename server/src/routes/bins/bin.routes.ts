import express from 'express'
import { getBinByCode } from './bin.controller'

const router = express.Router()

router.post('/getBin', getBinByCode)

export default router
