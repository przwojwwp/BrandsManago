const schedule = require('node-schedule');
const express = require('express');
const app = express();
const basicAuth = require('express-basic-auth');
const processOrder = require('./services/orders/processOrder');
const getOrders = require('./services/orders/getOrders');
const { setOrdersStorage, getOrdersStorage } = require('./services/ordersStorage');

const ordersRoutes = require('./services/csv/routes/ordersRoutes');

// Secure API with Basic Auth
app.use(basicAuth({
  users: {
    'admin': 'password'
  },
  challenge: true,
  realm: 'Restricted Access'
}));

let lastFetchedDate = '0';

const updateOrdersStorage = async () =>
{
  try
  {
    const allOrders = await getOrders(lastFetchedDate);

    const now = new Date();

    // Fetch time in format "year-month-day hour:minutes:seconds"
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    lastFetchedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const processedOrders = allOrders
      .map(processOrder)
      .filter(order => order.orderWorth !== '0 PLN');

    setOrdersStorage(processedOrders);

    console.log(JSON.stringify(processedOrders, null, 2));
    console.log(`All fetched orders - ${allOrders.length}`);
    console.log('------------');
    console.log(`${processedOrders.length} valid`);
    console.log('------------');
    console.log(`All saved: ${getOrdersStorage().length}`);
    console.log('------------');
    console.log(lastFetchedDate);
  } catch (err)
  {
    console.error('Wystąpił błąd:', err.message);
  }
};

// Defined endpoints from the ordersRoutes.js file
app.use(ordersRoutes);

// Server start
const PORT = 3000;
app.listen(PORT, () =>
{
  console.log(`Serwer działa na porcie ${PORT}`);
});

// Daily order collection schedule at 12 noon
schedule.scheduleJob('0 12 * * *', async () =>
{
  await updateOrdersStorage(lastFetchedDate);
});

// Initial download of orders
updateOrdersStorage();
