const axios = require('axios');
require('dotenv').config();

// const API_KEY = process.env.REACT_APP_API_KEY;
// const API_URL = process.env.REACT_APP_API_URL;
const API_KEY = 'YXBwbGljYXRpb24xNjpYeHI1K0MrNVRaOXBaY2lEcnpiQzBETUZROUxrRzFFYXZuMkx2L0RHRXZRdXNkcmF5R0Y3ZnhDMW1nejlmVmZP';
const API_URL = 'https://zooart6.yourtechnicaldomain.com/api/admin/v3/orders/orders/get'

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

module.exports = getOrders;
