const express = require('express');
const convertOrdersToCSV = require('../convertOrdersToCSV');
const router = express.Router();

const { getOrdersStorage } = require('../../ordersStorage');

// Endpoint to download all orders in CSV format
// http://localhost:3000/orders/csv

// Endpoint for downloading price orders
// http://localhost:3000/orders/csv?minWorth=<number>&maxWorth=<number>
router.get('/orders/csv', (req, res) =>
{
  const { minWorth, maxWorth } = req.query;

  const minWorthValue = minWorth ? parseFloat(minWorth) : null;
  const maxWorthValue = maxWorth ? parseFloat(maxWorth) : null;

  const ordersStorage = getOrdersStorage();

  const csv = convertOrdersToCSV(ordersStorage, null, minWorthValue, maxWorthValue);
  res.header('Content-Type', 'text/csv');
  res.attachment('orders.csv');
  res.send(csv);
});

// Endpoint for downloading a specific order in CSV format
// http://localhost:3000/orders/orderID/csv
router.get('/orders/:orderID/csv', (req, res) =>
{
  const orderID = req.params.orderID;
  const ordersStorage = getOrdersStorage();
  const order = ordersStorage.find((o) => o.orderID === orderID);

  if (order)
  {
    const csv = convertOrdersToCSV(order);
    res.header('Content-Type', 'text/csv');
    res.attachment(`${orderID}.csv`);
    res.send(csv);
  } else
  {
    res.status(404).json({ message: 'Order not found' });
  }
});

module.exports = router;
