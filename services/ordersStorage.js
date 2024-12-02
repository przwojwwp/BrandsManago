let ordersStorage = [];

const setOrdersStorage = (orders) =>
{
  ordersStorage = orders;
};

const getOrdersStorage = () => ordersStorage;

module.exports = { setOrdersStorage, getOrdersStorage };
