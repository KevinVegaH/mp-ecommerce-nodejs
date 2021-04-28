if (process.env.NODE_ENV !== 'production') require('dotenv').config();
const express = require('express');
const exphbs = require('express-handlebars');
const mercadopago = require('mercadopago'); // SDK

const port = process.env.PORT || 3000;

const app = express();

mercadopago.configure({
  integrator_id: process.env.INTEGRATOR_ID,
  access_token: process.env.ACCESS_TOKEN, // seller
});

app.use(express.json()); // parses application/json
app.use(express.urlencoded({ extended: true })); // parses application/x-www-form-urlencoded

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.static('assets'));

app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
  res.render('home');
});

app.get('/detail', function (req, res) {
  res.render('detail', req.query);
});

app.get('/success', function (req, res) {
  res.render('success', req.query);
});

app.get('/rejected', function (req, res) {
  res.render('rejected', req.query);
});

app.get('/pending', function (req, res) {
  res.render('pending', req.query);
});

app.post('/checkout', async (req, res) => {
  try {
    const { title, price, unit } = req.body;

    const HOST = req.get('host');
    const protocol =
      process.env.NODE_ENV === 'production' ? 'https://' : 'http://';

    let preference = {
      items: [
        {
          id: '1234',
          title: title,
          description: 'Dispositivo móvil de Tienda e-commerce',
          picture_url: 'https://courseit.com.ar/static/logo.png',
          unit_price: parseFloat(price),
          quantity: parseInt(unit),
        },
      ],
      external_reference: 'kevin.vega.h@hotmail.com',
      payer: {
        name: 'Lalo',
        surname: 'Landa',
        email: 'test_user_83958037@testuser.com',
        phone: {
          area_code: '52',
          number: parseInt('5549737300'),
        },
        address: {
          zip_code: '03940',
          street_name: 'Insurgentes Sur',
          street_number: parseInt('1602'),
        },
      },
      payment_methods: {
        excluded_payment_methods: [{ id: 'amex' }],
        excluded_payment_types: [{ id: 'atm' }],
        installments: 6,
        default_installments: 6,
      },
      notification_url: `${protocol}${HOST}/webhook`,
      back_urls: {
        success: `${protocol}${HOST}/success`,
        failure: `${protocol}${HOST}/pending`,
        pending: `${protocol}${HOST}/rejected`,
      },
      auto_return: 'approved',
    };
    const response = await mercadopago.preferences.create(preference);
    res.json({
      ok: true,
      init_point: response.body.init_point,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, message: error.message || error });
  }
});

app.get('/feedback', (req, res) => {
  res.json({
    payment: req.query.payment_id,
    paymentMethodId: req.query.payment_method_id,
    externalReference: req.query.external_reference,
    status: req.query.status,
    merchantOrder: req.query.merchant_order_id,
  });
});

app.get('/webhook', (req, res) => {
  console.log(req.body);
  return res.status(200);
});

app.listen(port);
