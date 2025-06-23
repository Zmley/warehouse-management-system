export const dynamsoftConfig = {
  license: process.env.REACT_APP_DYNAMSOFT_LICENSE!,
  container: '.barcode-scanner-view',
  uiPath: process.env.REACT_APP_DYNAMSOFT_UI_PATH!,
  engineResourcePaths: {
    rootDirectory: process.env.REACT_APP_DYNAMSOFT_RESOURCE_ROOT!
  }
}
