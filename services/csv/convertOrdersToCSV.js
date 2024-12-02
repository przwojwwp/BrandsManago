const { Parser } = require('json2csv');

// Funkcja do konwersji ordersStorage na CSV
const convertOrdersToCSV = (ordersStorage, orders = null, minWorth = null, maxWorth = null) =>
{
  // Jeśli przekazano tablicę zamówień, użyj jej, w przeciwnym razie użyj globalnego ordersStorage
  let ordersToConvert = orders || ordersStorage;
  ordersToConvert = Array.isArray(ordersToConvert) ? ordersToConvert : [ordersToConvert];

  const filteredOrders = ordersToConvert.filter(order =>
  {
    const orderWorth = parseFloat(order.orderWorth.replace(' PLN', ''));

    if (minWorth && orderWorth < minWorth) return false;
    if (maxWorth && orderWorth > maxWorth) return false;

    return true;
  })

  const formattedOrders = Array.isArray(filteredOrders) ? filteredOrders : [filteredOrders];

  const formattedData = formattedOrders.map((order) =>
  {
    const products = order.products.map((product) => `productID: ${product.productID}, quantity: ${product.quantity}`).join(' | ');
    return {
      orderID: order.orderID,
      products: products,
      orderWorth: order.orderWorth,
    };
  });

  const json2csvParser = new Parser();
  const csv = json2csvParser.parse(formattedData);
  return csv;
};

module.exports = convertOrdersToCSV;