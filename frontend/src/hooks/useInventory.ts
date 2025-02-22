import { useState, useEffect } from "react";
import { fetchInventory, deleteInventoryItem } from "../api/inventoryApi";
import { InventoryItem } from "../types/inventoryTypes";

const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchInventory();
        setInventory(data);
      } catch (err) {
        setError("❌ Failed to fetch inventory data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const removeInventoryItem = async (id: string) => {
    await deleteInventoryItem(id);
    setInventory((prevInventory) => prevInventory.filter((item) => item.id !== id));
  };
  

  return { inventory, loading, error, removeInventoryItem };
};

export default useInventory;