import { Task } from 'types/task'

/**
 * Unique product codes from the provided task rows (e.g. same subset as on-screen list).
 * Used for autocomplete hints only — API keyword search still scans all matching tasks.
 */
export function productCodesFromTasks(tasks: Task[]): string[] {
  const set = new Set<string>()
  for (const t of tasks) {
    const c = (t.productCode || '').trim()
    if (c) set.add(c)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}
