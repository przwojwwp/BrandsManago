const axios = require('axios');
require('dotenv').config();
const schedule = require('node-schedule');
const express = require('express');
const app = express();
const { Parser } = require('json2csv');
const basicAuth = require('express-basic-auth');

const API_KEY = process.env.REACT_APP_API_KEY;
const API_URL = process.env.REACT_APP_API_URL;

const basicAuthUsers = {
  admin: 'password',
}

app.use(basicAuth({
  users: basicAuthUsers,
  challenge: true,
  unauthorizedResponse: (req) => 'Nieautoryzowany dostęp'
}));

let lastFetchedDate = '0';
const ordersStorage = [];

// Funkcja pobierajaca zamowienia
const getOrders = async (sinceDate = '0') =>
{
  let currentPage = 0;
  let totalPages = 1;
  const allOrders = [];

  try
  {
    while (currentPage < totalPages)
    {
      const options = {
        method: 'POST',
        url: API_URL,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'X-API-KEY': API_KEY,
        },
        data: {
          params: {
            resultsPage: currentPage,
            resultsLimit: 100,
            ordersRange: {
              ordersDateRange:
              {
                ordersDateType: 'add',
                ordersDateBegin: sinceDate
              }
            }
          },
        },
      };

      const response = await axios.request(options);
      const data = response.data;

      if (data.Results)
      {
        allOrders.push(...data.Results);
      }

      currentPage++;
      totalPages = Math.ceil(data.resultsNumberAll / data.resultsLimit);
    }

    return allOrders;
  } catch (err)
  {
    console.log(`Błąd podczas pobierania zamówień na stronie ${currentPage}:`, err.message);
    throw err;
  }
}

// Funkcja do normalizowania danych
const processOrder = (order) =>
{
  const orderID = order.orderId;

  const products = order.orderDetails.productsResults.map(product => ({
    productID: product.productId,
    quantity: product.productQuantity,
  }));



  const deliveryCost = order.orderDetails.payments.orderBaseCurrency.orderDeliveryCost || 0;

  // bezpośrednie wyciągnięcie orderProductsCost daje inna wartość niż podliczenie produktów
  // const orderWorth = order.orderDetails.payments.orderCurrency.orderProductsCost;

  // calculate orderWorth
  let orderWorth = order.orderDetails.productsResults.reduce((total, product) =>
  {
    const { productOrderPrice, productQuantity } = product;
    // w wartosciach kluczy orderCurrencyValue dla tej samej waluty wystepuja rozne przeliczniki
    const currencyRate = order.orderDetails.payments.orderCurrency.orderCurrencyValue;
    const priceInBaseCurrency = productOrderPrice * currencyRate;

    return total + priceInBaseCurrency * productQuantity;
  }, 0);

  // Add deliveryCost
  orderWorth = orderWorth ? orderWorth + deliveryCost : orderWorth;

  return {
    orderID,
    products,
    orderWorth: `${Math.ceil(orderWorth * 100) / 100} PLN`,
  };
};

const fetchAllOrders = async () =>
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

// Funkcja do konwersji ordersStorage na CSV
const convertOrdersToCSV = (orders = null, minWorth = null, maxWorth = null) =>
{
  // Jeśli przekazano tablicę zamówień, użyj jej, w przeciwnym razie użyj globalnego ordersStorage
  let ordersToConvert = orders || ordersStorage;
  ordersToConvert = Array.isArray(ordersToConvert) ? ordersToConvert : [ordersToConvert];

  const filteredOrders = ordersToConvert.filter(order =>
  {
    const orderWorth = parseFloat(order.orderWorth.replace(' PLN', ''));

    if (minWorth && orderWorth < minWorth) throw new Error('Invalid minWorth');
    if (maxWorth && orderWorth > maxWorth) throw new Error('Invalid maxWorth');

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
  await fetchAllOrders(lastFetchedDate);
});

// Początkowe pobieranie zamówień
fetchAllOrders();