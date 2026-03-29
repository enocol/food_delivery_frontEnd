const orders = [];

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function saveOrderToDatabase(order) {
  await wait(700 + Math.floor(Math.random() * 500));

  const record = {
    id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    ...order,
  };

  orders.push(record);
  return record;
}

export function getSavedOrders() {
    
  return [...orders];
}
