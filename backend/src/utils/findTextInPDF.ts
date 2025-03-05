import config from 'config/config'
import * as fs from 'fs'
import * as path from 'path'
import pdf from 'pdf-parse'

const isFile = (filePath: string): boolean => {
  try {
    const stat = fs.statSync(filePath)
    return stat.isFile()
  } catch (e) {
    console.error(`Error checking if path is a file: ${e}`)
    return false
  }
}

const findTextInPDF = async (
  filePath: string,
  searchText: string
): Promise<string | null> => {
  if (!isFile(filePath)) {
    console.error('The provided path is not a file.')
    return null
  }

  const dataBuffer = fs.readFileSync(filePath)
  try {
    const data = await pdf(dataBuffer)

    if (data.text.includes(searchText)) {
      return filePath
    } else {
      return null
    }
  } catch (error) {
    console.error('Error reading PDF:', error)
    return null
  }
}

const findTextInAllPDFs = async (
  folderPath: string,
  searchText: string
): Promise<string[]> => {
  const foundFiles = []
  const files = fs.readdirSync(folderPath)
  for (let file of files) {
    const fullPath = path.join(folderPath, file)
    if (isFile(fullPath) && path.extname(file).toLowerCase() === '.pdf') {
      const result = await findTextInPDF(fullPath, searchText)
      if (result) {
        console.log(`Found "${searchText}" in file: ${fullPath}`)
        foundFiles.push(fullPath)
      }
    }
  }

  if (foundFiles.length === 0) {
    console.log(`No files found containing "${searchText}".`)
  }
  return foundFiles
}

const findTextInFBALabel = async (filePath: string, searchText: string) => {
  if (!isFile(filePath)) {
    return null
  }
  try {
    const dataBuffer = fs.readFileSync(filePath)
    const data = await pdf(dataBuffer, { max: 0 })
    const pages = data.text.split(/\n\s*\n/)
    const pageIndex = pages.findIndex(pageText => pageText.includes(searchText))
    return pageIndex >= 0 ? pageIndex : null
  } catch (error) {
    console.error('Error reading PDF:', error)
    return null
  }
}

export { isFile, findTextInAllPDFs, findTextInFBALabel }
