import config from 'config/config'
import { io } from 'socket.io-client'
import { findTextInAllPDFs, findTextInFBALabel } from './findTextInPDF'
import { printPDF, printAndRemovePDFPages } from './printPDF'

const { socketServerUrl, clientId } = config

const socket = io(socketServerUrl)
const rootFolderPath = config.onedriveRootPath
const folderPath = `${rootFolderPath}/Shipping Label`

const runSocket = () => {
  socket.on('connect', () => {
    console.log('Connected to socket server')
    socket.emit('register', clientId)
  })

  socket.on('registrationSuccess', message => {
    console.log(message)
  })

  socket.on('disconnect', reason => {
    console.log('Disconnected from socket server. Reason:', reason)
  })

  socket.on('orderNumber', async orderNumber => {
    console.log('Order number received from server:', orderNumber)
    try {
      const filePaths = await findTextInAllPDFs(folderPath, orderNumber)

      for (let i = 0; i < filePaths.length; i++) {
        await printPDF(filePaths[i])
      }
    } catch (error) {
      console.error('An error occurred:', error)
    }
  })

  socket.on('FBAPrint', async itemInfo => {
    console.log('Item info received from server:', itemInfo)
    const { FBANumber, itemSku } = itemInfo
    const baseDir = `${rootFolderPath}`
    const filePath = `${rootFolderPath}/FBA Item Label/${FBANumber}.pdf`
    const pageResult = await findTextInFBALabel(filePath, itemSku)
    await printAndRemovePDFPages(baseDir, FBANumber, [pageResult])
  })
}

export { runSocket }
