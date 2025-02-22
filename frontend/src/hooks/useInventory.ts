import { useState, useEffect } from 'react'
import {
  fetchInventory,
  deleteInventoryItem,
  addInventoryItem,
  updateInventoryItem
} from '../api/inventoryApi'
import { InventoryItem } from '../types/inventoryTypes'

const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ 获取库存数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchInventory()
        setInventory(data)
      } catch (err) {
        setError('❌ Failed to fetch inventory data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ✅ 删除库存项
  const removeInventoryItem = async (id: string) => {
    await deleteInventoryItem(id)
    setInventory(prevInventory => prevInventory.filter(item => item.id !== id))
  }

  // ✅ 添加库存项
  const addNewItem = async (item: Omit<InventoryItem, 'id'>) => {
    const newItem = await addInventoryItem(item)
    setInventory(prevInventory => [...prevInventory, newItem])
  }

  // ✅ 更新库存项（编辑）
 // ✅ 更新库存项（编辑）
const editInventoryItem = async (id: string, updatedData: Partial<InventoryItem>) => {
    await updateInventoryItem(id, updatedData) // ✅ 直接调用 API，不存储 `updatedItem`
    
    setInventory(prevInventory =>
      prevInventory.map(item =>
        item.id === id ? { ...item, ...updatedData } : item
      )
    )
  }

  return {
    inventory,
    loading,
    error,
    removeInventoryItem,
    addNewItem,
    editInventoryItem
  }
}

export default useInventory
