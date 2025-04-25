import Bin from 'routes/bins/bin.model'
import Inventory from 'routes/inventory/inventory.model'
import Task from 'routes/tasks/task.model'

export interface TaskWithJoin extends Task {
  destinationBin?: Bin
  sourceBin?: Bin
  inventories?: (Inventory & { Bin?: Bin })[]
}
