const axios = require('axios');

const options = {
  method: 'POST',
  url: 'https://https//zooart6.yourtechnicaldomain.com/api/admin/v3/orders/orders/api/admin/v3/orders/orders/get',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'X-API-KEY': 'YXBwbGljYXRpb24xNjpYeHI1K0MrNVRaOXBaY2lEcnpiQzBETUZROUxrRzFFYXZuMkx2L0RHRXZRdXNkcmF5R0Y3ZnhDMW1nejlmVmZP'
  }
};

axios
  .request(options)
  .then(res => console.log(res.data))
  .catch(err => console.error(err));