const schedule = require('node-schedule');
const express = require('express');
const app = express();
const basicAuth = require('express-basic-auth');
const processOrder = require('./services/orders/processOrder');
const getOrders = require('./services/orders/getOrders');
const { setOrdersStorage } = require('./services/ordersStorage'); // Import funkcji

const ordersRoutes = require('./services/csv/routes/ordersRoutes');

// Zabezpiecz API poprzez Basic Auth
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

    setOrdersStorage(processedOrders); // Poprawne ustawienie zamówień

    console.log(JSON.stringify(processedOrders, null, 2));
    console.log(`Posiadamy ${processedOrders.length} zapisanych zamówień.`);
    console.log('Nowe zamówienia:', allOrders.length);
    console.log(lastFetchedDate);
  } catch (err)
  {
    console.error('Wystąpił błąd:', err.message);
  }
};

// Używamy zdefiniowanych endpointów z pliku orders.js
app.use(ordersRoutes);

// Uruchomienie serwera
const PORT = 3000;
app.listen(PORT, () =>
{
  console.log(`Serwer działa na porcie ${PORT}`);
});

// Harmonogram codziennego pobierania zamówień o 12 w południe
schedule.scheduleJob('0 12 * * *', async () =>
{
  await updateOrdersStorage();
});

// Początkowe pobieranie zamówień
updateOrdersStorage();
