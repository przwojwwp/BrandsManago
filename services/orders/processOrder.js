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

module.exports = processOrder;
