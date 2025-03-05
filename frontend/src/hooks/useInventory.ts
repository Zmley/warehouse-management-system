import { useEffect, useState } from "react";
import {
  fetchInventory,
  deleteInventoryItem,
  addInventoryItem,
  updateInventoryItem
} from "../api/inventoryApi";
import { InventoryItem } from "../types/inventoryTypes";
import { useInventoryContext } from "../context/InventoryContext";

const useInventory = () => {
  const { inventory, setInventory } = useInventoryContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ 获取库存数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchInventory();
        setInventory(data);
      } catch (err) {
        setError("❌ Failed to fetch inventory data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setInventory]);

  // ✅ 删除库存项
  const removeInventoryItem = async (id: string) => {
    await deleteInventoryItem(id);
    setInventory((prevInventory) => prevInventory.filter((item) => item.id !== id));
  };

  // ✅ 添加库存项
  const addNewItem = async (item: Omit<InventoryItem, "id">) => {
    // ✅ 先检查 `inventory` 是否已有相同 `product_code` 在相同 `bin_code`
    const existingItem = inventory.find(
      (i) =>
        i.warehouse_code === item.warehouse_code &&
        i.bin_code === item.bin_code &&
        i.product_code === item.product_code
    );
  
    if (existingItem) {
      // ✅ 如果存在相同项，直接更新数量
      const updatedQuantity = existingItem.quantity + item.quantity;
  
      await updateInventoryItem(existingItem.id, { quantity: updatedQuantity });
  
      // ✅ 立即更新前端 UI
      setInventory((prevInventory) =>
        prevInventory.map((inv) =>
          inv.id === existingItem.id ? { ...inv, quantity: updatedQuantity } : inv
        )
      );
    } else {
      // ✅ 如果不存在，创建新项
      const newItem = await addInventoryItem(item);
      setInventory((prevInventory) => [...prevInventory, newItem]); // ✅ 立即更新 UI
    }
  };

  // ✅ 更新库存项
  const editInventoryItem = async (id: string, updatedData: Partial<InventoryItem>) => {
    await updateInventoryItem(id, updatedData);
    setInventory((prevInventory) =>
      prevInventory.map((item) =>
        item.id === id ? { ...item, ...updatedData } : item
      )
    );
  };

  return {
    inventory,
    loading,
    error,
    removeInventoryItem,
    addNewItem,
    editInventoryItem,
  };
};

export default useInventory;