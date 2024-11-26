const axios = require('axios');
require('dotenv').config();

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

    // Tworzymy tablicę dla wszystkich przekształconych zamówień
    const ordersData = data.Results.map(order =>
    {
      // Pobieramy ID zamówienia
      const orderID = order.orderId;

      // Mapujemy produkty do pożądanej struktury
      const products = order.orderDetails.productsResults.map(product => ({
        productID: product.productId,
        quantity: product.productQuantity,
      }));

      // Sumujemy wartość zamówienia, uwzględniając ilość
      const orderWorth = order.orderDetails.productsResults.reduce((total, product) =>
      {
        return total + (product.productOrderPriceNet * product.productQuantity);  // Mnożymy cenę przez ilość
      }, 0);

      // Tworzymy obiekt w wymaganym formacie
      return {
        orderID: orderID,
        products: products,
        orderWorth: Math.floor(orderWorth * 100) / 100
      };
    });

    // Wyświetlamy wynik
    console.log(JSON.stringify(ordersData, null, 2));  // Formatujemy wynik na czytelny JSON
  } catch (error)
  {
    console.error('Błąd podczas pobierania zamówień:', error);
  }
};

fetchAllOrders();
