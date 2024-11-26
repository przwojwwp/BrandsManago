const axios = require('axios');
require('dotenv').config();
const schedule = require('node-schedule');

const API_KEY = process.env.REACT_APP_API_KEY;
const API_URL = process.env.REACT_APP_API_URL;


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
        limit: 100,  // Nie wiem czemu bez tego nie działa
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

    // Wyświetlanie wyniku
    console.log(JSON.stringify(ordersData, null, 2));  // Formatujemy wynik na czytelny JSON
    // console.log(data.Results.reverse().slice(0, 1));
  } catch (error)
  {
    console.error('Błąd podczas pobierania zamówień:', error);
  }
};

// Codzienne uruchamianie funkcji w południe
schedule.scheduleJob('* * * * *', async () =>
{
  await fetchAllOrders();
});
