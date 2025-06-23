export const dynamsoftConfig = {
  license: process.env.REACT_APP_DYNAMSOFT_LICENSE,
  container: '.barcode-scanner-view',
  uiPath:
    'https://cdn.jsdelivr.net/npm/dynamsoft-barcode-reader-bundle@10.5.3000/dist/',
  engineResourcePaths: {
    rootDirectory:
      'https://cdn.jsdelivr.net/npm/dynamsoft-barcode-reader-bundle@10.5.3000/dist/'
  }
}
