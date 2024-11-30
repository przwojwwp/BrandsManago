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

// Funkcja do pobierania zamówień z jednej strony
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
        allOrders.push(...data.Results); // Dodanie wyników z bieżącej strony
      }

      currentPage++;
      totalPages = Math.ceil(data.resultsNumberAll / data.resultsLimit);
    }

    return allOrders; // Zwracamy wszystkie zamówienia
  } catch (err)
  {
    console.error(`Błąd podczas pobierania zamówień na stronie ${currentPage}:`, err.message);
    throw err;
  }
};

// Funkcja do przetwarzania pojedynczego zamówienia
const processOrder = (order) =>
{
  const orderID = order.orderId;

  const products = order.orderDetails.productsResults.map((product) => ({
    productID: product.productId,
    quantity: product.productQuantity,
  }));

  const orderWorth = order.orderDetails.productsResults.reduce((total, product) =>
  {
    const { productOrderPriceNet, productQuantity } = product;
    const currencyRate = order.orderDetails.payments.orderCurrency.orderCurrencyValue;

    const priceInBaseCurrency = productOrderPriceNet * currencyRate;

    return total + priceInBaseCurrency * productQuantity;
  }, 0);

  return {
    orderID,
    products,
    orderWorth: `${Math.floor(orderWorth * 100) / 100} PLN`,
  };
};

// Główna funkcja do pobierania i przetwarzania zamówień
const fetchAllOrders = async () =>
{
  try
  {
    const allOrders = await getOrders(); // Pobranie wszystkich zamówień

    // Przetwarzanie i filtrowanie zamówień
    const processedOrders = allOrders
      .map(processOrder) // Przetwarzanie zamówień
      .filter((order) => order.orderWorth !== '0 PLN'); // Filtrowanie zamówień

    ordersStorage.push(...processedOrders); // Przechowywanie przetworzonych zamówień

    console.log(JSON.stringify(ordersStorage, null, 2));
    console.log(`Zebrano ${ordersStorage.length} zamówień.`);
  } catch (err)
  {
    console.error('Wystąpił błąd:', err.message);
  }
};

fetchAllOrders();