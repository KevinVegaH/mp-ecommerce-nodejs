const express = require('express');
const exphbs = require('express-handlebars');
const mercadopago = require('mercadopago'); // SDK

const port = process.env.PORT || 3000;

const app = express();

mercadopago.configure({
  access_token:
    'APP_USR-2572771298846850-120119-a50dbddca35ac9b7e15118d47b111b5a-681067803', // seller
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

app.post('/checkout', async (req, res) => {
  try {
    const { title, price, unit } = req.body;

    if (!(/^[0-9]+$/.test(price) && /^[0-9]+$/.test(unit))) {
      res.status(400).json({
        ok: false,
        message: 'Price and unit must be numbers',
      });
    }

    let preference = {
      items: [
        {
          title: title,
          unit_price: Number(price),
          quantity: Number(unit),
        },
      ],
    };
    const response = await mercadopago.preferences.create(preference);
    res.json({
      ok: true,
      init_point: response.body.init_point,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok: false, message: error.message });
  }
});

app.listen(port);
