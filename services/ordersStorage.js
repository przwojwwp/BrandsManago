let ordersStorage = [];

const setOrdersStorage = (orders) =>
{
  ordersStorage.push(...orders);
};

const getOrdersStorage = () => ordersStorage;

module.exports = { setOrdersStorage, getOrdersStorage };
