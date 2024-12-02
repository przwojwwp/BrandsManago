const schedule = require('node-schedule');
const express = require('express');
const app = express();
const { Parser } = require('json2csv');
const basicAuth = require('express-basic-auth');

const processOrder = require('./services/processOrder');
const getOrders = require('./services/getOrders');
const { convertOrdersToCSV } = require('./services/convertOrdersToCSV');

// Zabezpiecz API poprzez Basic Auth
app.use(basicAuth({
  users: {
    'admin': 'password'
  },
  challenge: true,
  realm: 'Restricted Access'
}));

let lastFetchedDate = '0';
const ordersStorage = [];

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

    ordersStorage.push(...processedOrders);

    console.log(JSON.stringify(ordersStorage, null, 2));
    console.log(`Posiadamy ${ordersStorage.length} zapisanych zamówień.`);
    console.log('Nowe zamówienia:', allOrders.length);
    console.log(lastFetchedDate);
  } catch (err)
  {
    console.error('Wystąpił błąd:', err.message);
  }
};

// Endpoint do pobierania wszystkich zamówień w formacie CSV
// http://localhost:3000/orders/csv

// Endpoint do pobierania zamówień w zakresie cen
// http://localhost:3000/orders/csv?minWorth=<number>&maxWorth=<number>
app.get('/orders/csv', (req, res) =>
{
  const { minWorth, maxWorth } = req.query;

  const minWorthValue = minWorth ? parseFloat(minWorth) : null;
  const maxWorthValue = maxWorth ? parseFloat(maxWorth) : null;

  const csv = convertOrdersToCSV(null, minWorthValue, maxWorthValue);
  res.header('Content-Type', 'text/csv');
  res.attachment('orders.csv');
  res.send(csv);
});

// Endpoint do pobierania konkretnego zamówienia
// http://localhost:3000/orders/orderID/csv
app.get('/orders/:orderID/csv', (req, res) =>
{
  const orderID = req.params.orderID;
  const order = ordersStorage.find((o) => o.orderID === orderID);

  if (order)
  {
    const csv = convertOrdersToCSV(order); // Przekazanie pojedynczego zamówienia
    res.header('Content-Type', 'text/csv');
    res.attachment(`${orderID}.csv`);
    res.send(csv);
  } else
  {
    res.status(404).json({ message: 'Order not found' });
  }
});

// Uruchomienie serwera
const PORT = 3000;
app.listen(PORT, () =>
{
  console.log(`Serwer działa na porcie ${PORT}`);
});

// Harmonogram codziennego pobierania zamówień o 12 w południe
schedule.scheduleJob('0 12 * * *', async () =>
{
  await updateOrdersStorage(lastFetchedDate);
});

// Początkowe pobieranie zamówień
updateOrdersStorage();