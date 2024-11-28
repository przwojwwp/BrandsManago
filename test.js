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
        ordersSerialNumbers: 194, // jak to usuniemy to jest blad
      }
    });

    const data = response.data;

    console.log(data);
  } catch (error)
  {
    console.error('Błąd podczas pobierania zamówień:', error);
  }
}

fetchAllOrders();