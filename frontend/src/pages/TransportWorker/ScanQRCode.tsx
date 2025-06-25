// ScanBasic.tsx
import { useEffect, useRef } from 'react'
import { Box, Typography } from '@mui/material'

// Dynamsoft is attached to the global window object by the SDK script
declare global {
  interface Window {
    Dynamsoft: any
  }
}

const license =
  'DLS2eyJoYW5kc2hha2VDb2RlIjoiMTA0MTYzMjYwLVRYbFhaV0pRY205cSIsIm1haW5TZXJ2ZXJVUkwiOiJodHRwczovL21kbHMuZHluYW1zb2Z0b25saW5lLmNvbSIsIm9yZ2FuaXphdGlvbklEIjoiMTA0MTYzMjYwIiwic3RhbmRieVNlcnZlclVSTCI6Imh0dHBzOi8vc2Rscy5keW5hbXNvZnRvbmxpbmUuY29tIiwiY2hlY2tDb2RlIjoxMTQyNzEzNDB9'

const ScanBasic = () => {
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    const loadAndInit = async () => {
      try {
        const { Dynamsoft } = window

        // 1. 初始化 license
        await Dynamsoft.License.LicenseManager.initLicense(license)

        // 2. 加载必要模块
        await Dynamsoft.Core.CoreModule.loadWasm(['DBR'])

        // 3. 创建 UI 和增强器
        const cameraView = await Dynamsoft.DCE.CameraView.createInstance()
        const cameraEnhancer =
          await Dynamsoft.DCE.CameraEnhancer.createInstance(cameraView)
        document
          .getElementById('scanner-view')
          ?.append(cameraView.getUIElement())

        // 4. 创建路由器
        const router = await Dynamsoft.CVR.CaptureVisionRouter.createInstance()
        await router.setInput(cameraEnhancer)

        // 5. 设置回调
        const receiver = new Dynamsoft.CVR.CapturedResultReceiver()
        receiver.onCapturedResultReceived = (result: any) => {
          for (const item of result.items) {
            if (item.type === 'barcode') {
              const text = item.barcodeResult.barcodeText
              console.log('✅ Scanned:', text)
              alert('Scanned: ' + text)
            }
          }
        }
        router.addResultReceiver(receiver)

        // 6. 打开摄像头并开始扫码
        await cameraEnhancer.open()
        await router.startCapturing('ReadBarcodes_SpeedFirst')

        scannerRef.current = { cameraEnhancer, router }
      } catch (err) {
        console.error('❌ Failed to init scanner:', err)
      }
    }

    loadAndInit()

    return () => {
      scannerRef.current?.router?.stopCapturing()
      scannerRef.current?.cameraEnhancer?.close()
    }
  }, [])

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant='h6' mb={2}>
        📷 Scan Barcode
      </Typography>
      <Box
        id='scanner-view'
        sx={{
          width: '100%',
          maxWidth: 500,
          height: 300,
          border: '2px solid #ccc',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      />
    </Box>
  )
}

export default ScanBasic
