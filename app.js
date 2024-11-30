const axios = require('axios');
require('dotenv').config();
const schedule = require('node-schedule');
const express = require('express');
// const fs = require('fs');
const app = express();
const { Parser } = require('json2csv');

const API_KEY = process.env.REACT_APP_API_KEY;
const API_URL = process.env.REACT_APP_API_URL;

const ordersStorage = [];

const fetchAllOrders = async () =>
{
  let currentPage = 0;
  let totalPages = 1; // Początkowa wartość - zostanie zaktualizowana po pierwszym zapytaniu

  try
  {
    // Przechodzenie przez wszystkie strony
    while (currentPage < totalPages)
    {
      // zrobic z tego getOrders(pages)
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
        // Użycie map do przetworzenia wyników i utworzenia nowej tablicy
        let ordersData = data.Results.map((order) =>
        {
          // Pobieranie ID zamówienia
          const orderID = order.orderId;

          // Przetwarzanie produktów zamówienia
          const products = order.orderDetails.productsResults.map((product) => ({
            productID: product.productId,
            quantity: product.productQuantity,
          }));

          // Obliczanie wartości zamówienia
          const orderWorth = order.orderDetails.productsResults.reduce((total, product) =>
          {
            const { productOrderPriceNet, productQuantity } = product;
            const currencyRate = order.orderDetails.payments.orderCurrency.orderCurrencyValue;

            // Jeśli waluta produktu różni się od bazowej, przelicz na bazową
            const priceInBaseCurrency = productOrderPriceNet * currencyRate;

            return total + priceInBaseCurrency * productQuantity; // Dodaj do sumy
          }, 0);

          // Zwracanie zamówienia w wymaganym formacie
          return {
            orderID,
            products,
            orderWorth: `${Math.floor(orderWorth * 100) / 100} PLN`,
          };
        });

        // Filtrowanie pustych zamówień
        ordersData = ordersData.filter(order => order.orderWorth !== '0 PLN');


        // Dodawanie przetworzonych zamówień do ordersStorage
        ordersStorage.push(...ordersData);
      }

      // Aktualizacja informacji o stronach
      currentPage++;
      totalPages = Math.ceil(data.resultsNumberAll / data.resultsLimit);
    }

    console.log(JSON.stringify(ordersStorage, null, 2));

    // Wyświetlanie długości tablicy zamówień
    console.log(`Zebrano ${ordersStorage.length} zamówień.`);
  } catch (err)
  {
    console.error('Wystąpił błąd:', err.message);
  }
};

// Funkcja do konwersji ordersStorage na CSV
const convertOrdersToCSV = () =>
{
  const formattedOrders = ordersStorage.map((order) =>
  {
    const products = order.products.map((product) => `ID: ${product.productID}, Quantity: ${product.quantity}`).join(' | ');
    return {
      orderID: order.orderID,
      products: products,
      orderWorth: order.orderWorth,
    };
  });

  const json2csvParser = new Parser();
  const csv = json2csvParser.parse(formattedOrders);
  return csv;
};

// Endpoint do pobierania wszystkich zamówień w formacie CSV
app.get('/orders/csv', (_req, res) =>
{
  const csv = convertOrdersToCSV();
  res.header('Content-Type', 'text/csv');
  res.attachment('orders.csv');
  res.send(csv);
});

// Endpoint do pobierania konkretnego zamówienia
app.get('/orders/:orderID', (req, res) =>
{
  const orderID = req.params.orderID;
  const order = ordersStorage.find((o) => o.orderID === parseInt(orderID));

  if (order)
  {
    res.json(order);
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
// schedule.scheduleJob('0 12 * * *', async () =>
// {
//   await fetchAllOrders();
// });

// Początkowe pobieranie zamówień
fetchAllOrders();