const { Parser } = require('json2csv');

const convertOrdersToCSV = (ordersStorage, orders = null, minWorth = null, maxWorth = null) =>
{
  // Make sure its array
  let ordersToConvert = orders || ordersStorage;
  ordersToConvert = Array.isArray(ordersToConvert) ? ordersToConvert : [ordersToConvert];

  // Orders worth filtration
  const filteredOrders = ordersToConvert.filter(order =>
  {
    const orderWorth = parseFloat(order.orderWorth.replace(' PLN', ''));

    if (minWorth && orderWorth < minWorth) return false;
    if (maxWorth && orderWorth > maxWorth) return false;

    return true;
  })

  // Make proper shape of data
  const formattedData = filteredOrders.map((order) =>
  {
    const products = order.products.map((product) => `productID: ${product.productID}, quantity: ${product.quantity}`).join(' | ');
    return {
      orderID: order.orderID,
      products: products,
      orderWorth: order.orderWorth,
    };
  });

  // Convert to CSV
  const json2csvParser = new Parser();
  const csv = json2csvParser.parse(formattedData);
  return csv;
};

module.exports = convertOrdersToCSV;
