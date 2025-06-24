export const dynamsoftConfig = {
  license: process.env.REACT_APP_DYNAMSOFT_LICENSE || '',
  container: '.barcode-scanner-view', // 用于挂载摄像头UI
  uiPath:
    'https://cdn.jsdelivr.net/npm/dynamsoft-barcode-reader-bundle@10.5.3000/dist/',

  // Dynamsoft 引擎加载资源目录
  engineResourcePaths: {
    rootDirectory:
      'https://cdn.jsdelivr.net/npm/dynamsoft-barcode-reader-bundle@10.5.3000/dist/'
  },

  // 推荐增加以下设置：扫码模块加载预热
  preloadModules: ['DBR'],

  // 是否启用扫码激光动画（UI）
  scanLaserVisible: true,

  // 可选：指定扫码模板
  templateName: 'ReadBarcodes_SpeedFirst'
}
