import { print } from 'pdf-to-printer'
import fs from 'fs/promises'
import path from 'path'
import config from 'config/config'
import { PDFDocument } from 'pdf-lib'

const { printerName } = config
const printPDF = async (filePath: string) => {
  console.log(`Preparing to print PDF: ${filePath}`)

  try {
    await print(filePath, {
      printer: printerName,
      scale: 'fit',
      monochrome: true,
      paperSize: 'letter'
    })
    console.log(`Successfully printed: ${filePath}`)

    try {
      const dir = path.dirname(filePath)
      const targetDir = path.join(dir, '../Shipping Label Printer')
      const newFullPath = path.join(targetDir, path.basename(filePath))

      await fs.rename(filePath, newFullPath)
      console.log(`Moved ${filePath} to ${newFullPath}`)
    } catch (err) {
      console.error(`Failed to move ${filePath}: ${err}`)
    }
  } catch (err) {
    console.error(`Failed to print ${filePath}: ${err}`)
  }
}

const printAndRemovePDFPages = async (
  baseDir: string,
  FBANumber: string,
  pagesToPrint: number[]
) => {
  const originalDir = path.join(baseDir, 'FBA Item Label')
  const filePath = path.join(originalDir, `${FBANumber}.pdf`)

  const printedDir = path.join(baseDir, 'FBA Item Label Printed')

  if (pagesToPrint && pagesToPrint.length > 0) {
    const fileBuf = await fs.readFile(filePath)
    const originalDoc = await PDFDocument.load(fileBuf)

    const printDoc = await PDFDocument.create()
    for (const pageNo of pagesToPrint) {
      const [copiedPage] = await printDoc.copyPages(originalDoc, [pageNo - 1])
      printDoc.addPage(copiedPage)
    }

    await fs.mkdir(printedDir, { recursive: true })
    const ext = path.extname(filePath)
    const baseName = path.basename(filePath, ext)

    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const ss = String(now.getSeconds()).padStart(2, '0')
    const timestamp = `${y}${m}${d}_${hh}${mm}${ss}`

    const printedFilename = `${baseName}_printed_${timestamp}${ext}`
    const printedPdfPath = path.join(printedDir, printedFilename)
    const printedPdfBytes = await printDoc.save()
    await fs.writeFile(printedPdfPath, printedPdfBytes)

    try {
      await print(printedPdfPath, {
        printer: printerName,
        scale: 'fit',
        monochrome: true,
        paperSize: 'letter'
      })
      console.log(`Successfully printed: ${printedPdfPath}`)
    } catch (err) {
      console.error(`Printing failed: ${err}`)
    }
  }

  try {
    const fileBuf = await fs.readFile(filePath)
    const originalDoc = await PDFDocument.load(fileBuf)
    const pageCount = originalDoc.getPageCount()
    const allPageIndexes = [...Array(pageCount).keys()]
    const pagesToRemoveSet = new Set(
      (pagesToPrint || []).map(p => p - 1).filter(p => p >= 0 && p < pageCount)
    )
    const leftoverDoc = await PDFDocument.create()
    for (const idx of allPageIndexes) {
      if (!pagesToRemoveSet.has(idx)) {
        const [cp] = await leftoverDoc.copyPages(originalDoc, [idx])
        leftoverDoc.addPage(cp)
      }
    }
    try {
      const tempDir = path.join(__dirname, 'temp')
      await fs.mkdir(tempDir, { recursive: true })
      const leftoverTempPath = path.join(tempDir, 'temp_leftover.pdf')
      const leftoverBytes = await leftoverDoc.save()
      await fs.writeFile(leftoverTempPath, leftoverBytes)
      await fs.unlink(filePath)
      await fs.rename(leftoverTempPath, filePath)

      console.log(
        `Successfully replaced original PDF with leftover: ${filePath}`
      )
    } catch (err) {
      console.error('Failed to remove/replace the original PDF:', err)
    }

    console.log(
      `Overwrote original PDF with leftover (unprinted) pages: ${filePath}`
    )
  } catch (err) {
    console.error(`Failed to remove pages from original PDF: ${err}`)
  }
}

export { printPDF, printAndRemovePDFPages }
