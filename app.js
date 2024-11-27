const axios = require('axios');
require('dotenv').config();
const schedule = require('node-schedule');
const express = require('express');
const app = express();

const API_KEY = process.env.REACT_APP_API_KEY;
const API_URL = process.env.REACT_APP_API_URL;

const ordersStorage = [];

const fetchAllOrders = async () =>
{
  try
  {
    const response = await axios.get(API_URL, {
      headers: {
        'accept': 'application/json',
        'X-API-KEY': API_KEY
      },
      params: {
        limit: 10,
      }
    });

    const data = response.data;

    // Tworzenie tablicy dla wszystkich przekształconych zamówień
    const ordersData = data.Results.map(order =>
    {
      // Pobiernie ID zamówienia
      const orderID = order.orderId;

      // Mapowanie produktów do pożądanej struktury
      const products = order.orderDetails.productsResults.map(product => ({
        productID: product.productId,
        quantity: product.productQuantity,
      }));

      // Sumowanie wartości zamówienia, uwzględniając ilość
      const orderWorth = order.orderDetails.productsResults.reduce((total, product) =>
      {
        return total + (product.productOrderPriceNet * product.productQuantity);  // Mnożymy cenę przez ilość
      }, 0);

      // Tworzenie obiektu w wymaganym formacie
      return {
        orderID: orderID,
        products: products,
        orderWorth: Math.floor(orderWorth * 100) / 100
      };
    });

    // Zapisanie zamówień w pamięci
    ordersStorage.length = 0;
    ordersStorage.push(...ordersData);

    console.log(data);
    console.log(data.Results.length);
  } catch (error)
  {
    console.error('Błąd podczas pobierania zamówień:', error);
  }
};

// app.get('/orders', (_req, res) =>
// {
//   res.json(ordersStorage);
// })

// const PORT = 3000;
// app.listen(PORT, () =>
// {
//   console.log(`Serwer działa na porcie ${PORT}`);
// })

fetchAllOrders();

// Codzienne uruchamianie funkcji w południe
// schedule.scheduleJob('0 12 * * *', async () =>
// {
//   await fetchAllOrders();
// });

