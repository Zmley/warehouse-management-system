import { Server } from 'http'
import app from 'app'
import config from 'config/config'
import logger from 'utils/logger'
import errorHandler from 'utils/errorHandler'
import { runSocket } from 'utils/socketHandler'

const { port } = config

const server: Server = app.listen(port, (): void => {
  logger.info(`Application listens on PORT: ${port}`)
})

runSocket()

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error)
  unexpectedErrorHandler(error)
})

const exitHandler = (): void => {
  if (app) {
    server.close(() => {
      logger.info('Server closed')
      process.exit(1)
    })
  } else {
    process.exit(1)
  }
}

const unexpectedErrorHandler = (error: Error): void => {
  errorHandler.handleError(error)
  if (!errorHandler.isTrustedError(error)) {
    exitHandler()
  }
}
