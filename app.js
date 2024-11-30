const axios = require('axios');
require('dotenv').config();
const schedule = require('node-schedule');
const express = require('express');
const app = express();
const { Parser } = require('json2csv');

const API_KEY = process.env.REACT_APP_API_KEY;
const API_URL = process.env.REACT_APP_API_URL;

const ordersStorage = [];

// Funkcja pobierajaca zamowienia
const getOrders = async () =>
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

  const orderWorth = order.orderDetails.productsResults.reduce((total, product) =>
  {
    const { productOrderPrice, productQuantity } = product;
    const currencyRate = order.orderDetails.payments.orderCurrency.orderCurrencyValue;

    const priceInBaseCurrency = productOrderPrice * currencyRate;

    return total + priceInBaseCurrency * productQuantity;
  }, 0);

  return {
    orderID,
    products,
    orderWorth: `${Math.floor(orderWorth * 100) / 100} PLN`,
  };
};

const fetchAllOrders = async () =>
{
  try
  {
    const allOrders = await getOrders();

    const processedOrders = allOrders
      .map(processOrder)
      .filter(order => order.orderWorth !== '0 PLN');

    ordersStorage.push(...processedOrders);

    console.log(JSON.stringify(ordersStorage, null, 2));
    console.log(`Otrzymano ${ordersStorage.length} zamówień.`);
  } catch (err)
  {
    console.error('Wystąpił błąd:', err.message);
  }
};

// Funkcja do konwersji ordersStorage na CSV
const convertOrdersToCSV = (orders = null) =>
{
  // Jeśli przekazano tablicę zamówień, użyj jej, w przeciwnym razie użyj globalnego ordersStorage
  const ordersToConvert = orders || ordersStorage;

  // Normalizacja danych do formatu CSV
  const formattedOrders = Array.isArray(ordersToConvert) ? ordersToConvert : [ordersToConvert]; // Obsługuje zarówno pojedyncze zamówienie, jak i tablicę zamówień

  const formattedData = formattedOrders.map((order) =>
  {
    const products = order.products.map((product) => `ID: ${product.productID}, Quantity: ${product.quantity}`).join(' | ');
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
app.get('/orders/csv', (_req, res) =>
{
  const csv = convertOrdersToCSV(); // Przekazanie wszystkich zamówień
  res.header('Content-Type', 'text/csv');
  res.attachment('orders.csv');
  res.send(csv);
});

// Endpoint do pobierania konkretnego zamówienia
app.get('/orders/:orderID/csv', (req, res) =>
{
  const orderID = req.params.orderID;
  const order = ordersStorage.find((o) => o.orderID === orderID);  // Używaj `orderID` jako string

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

// Harmonogram codziennego pobierania zamówień
schedule.scheduleJob('0 12 * * *', async () =>
{
  await fetchAllOrders();
});

// Początkowe pobieranie zamówień
fetchAllOrders();