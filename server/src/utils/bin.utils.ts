import Bin from 'routes/bins/bin.model'
import Inventory from 'routes/inventory/inventory.model'

export function buildBinCodeToIDMap(bins: Bin[]): Map<string, string> {
  const map = new Map<string, string>()
  bins.forEach(bin => {
    map.set(bin.binCode.trim(), bin.binID)
  })
  return map
}

export const buildExistingInventoryKeySet = (list: Inventory[]) => {
  const set = new Set<string>()
  list.forEach(inv => {
    set.add(`${inv.binID}-${inv.productCode.trim().toUpperCase()}`)
  })
  return set
}
