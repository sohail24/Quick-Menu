// src/lib/orderStorage.ts
const KEY = 'qm_active_orders_v1';

export type ActiveOrderItem = {
  orderId: string;
  tableId: string;
  placedAt?: string;
  lastSeenAt?: number;
  tableName?: string;
};

export function getActiveOrders(): Record<string, ActiveOrderItem> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.warn('getActiveOrders parse error', e);
    return {};
  }
}

export function saveActiveOrders(map: Record<string, ActiveOrderItem>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('saveActiveOrders error', e);
  }
}

export function setActiveOrder(
  restaurantId: string,
  tableId: string,
  orderId: string,
  placedAt?: string,
  tableName?: string,
) {
  const key = `${restaurantId}_${tableId}`;
  const map = getActiveOrders();
  map[key] = { orderId, tableId, placedAt, tableName, lastSeenAt: Date.now() };
  saveActiveOrders(map);
}

export function removeActiveOrder(restaurantId: string, tableId: string) {
  const key = `${restaurantId}_${tableId}`;
  const map = getActiveOrders();
  delete map[key];
  saveActiveOrders(map);
}

export function getActiveOrderFor(restaurantId: string, tableId: string): ActiveOrderItem | null {
  const key = `${restaurantId}_${tableId}`;
  const map = getActiveOrders();
  return map[key] ?? null;
}

export function updateLastSeen(restaurantId: string, tableId: string) {
  const key = `${restaurantId}_${tableId}`;
  const map = getActiveOrders();
  if (map[key]) {
    map[key].lastSeenAt = Date.now();
    saveActiveOrders(map);
  }
}

export function removeActiveOrderById(orderId: string) {
  const map = getActiveOrders();
  let changed = false;
  for (const key in map) {
    if (map[key].orderId === orderId) {
      delete map[key];
      changed = true;
    }
  }
  if (changed) {
    saveActiveOrders(map);
  }
}
