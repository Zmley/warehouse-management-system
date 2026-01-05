import { DeviceType, Mode } from 'constants/index'
import { getDevicePreference, setDevicePreference } from './Storages'

export const getDeviceOrDefault = (): DeviceType => {
  const raw = getDevicePreference()
  if (raw === DeviceType.PHONE || raw === DeviceType.SCANNER) return raw
  setDevicePreference(DeviceType.PHONE)
  return DeviceType.PHONE
}

export const getDefaultModeFromDevice = (): Mode => {
  const device = getDeviceOrDefault()
  return device === DeviceType.SCANNER ? Mode.GUN : Mode.CAMERA
}
