const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
require('dotenv').config();

const Weather = require('./models/weather'); // Ensure this model is defined correctly
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { 
  // Use new options for mongoose
  useNewUrlParser: true,
  useUnifiedTopology: true 
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Email Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Function to send alert email
function sendAlert(city, temp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'recipient@example.com', // Change this to the recipient's email
    subject: `Weather Alert for ${city}`,
    text: `Temperature in ${city} exceeded the threshold: ${temp}°C`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Alert email sent:', info.response);
    }
  });
}

// Routes
app.get('/', (req, res) => {
  res.render('weather', {
    City: "Delhi",
    Country: "IN",
    Temperature: "31.4",
    Humidity: "78",
    Wind: "4"
  });
});

app.post('/', async (req, res) => {
  const city = req.body.city;
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.API_KEY}`;

  console.log(`Fetching weather data for: ${apiUrl}`); // Log the API URL

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (data.cod !== 200) {
      throw new Error(data.message); // Handle API errors
    }

    const temperature = (data.main.temp - 273.15).toFixed(2); // Convert from Kelvin to Celsius

    // Save weather data to MongoDB
    await Weather.create({
      city: data.name,
      temperature: temperature,
      humidity: data.main.humidity,
      wind: data.wind.speed
    });

    // Trigger alert if temperature exceeds 35°C
    if (temperature > 35) sendAlert(data.name, temperature);

    res.render('weather', {
      City: data.name,
      Country: data.sys.country,
      Temperature: temperature,
      Humidity: data.main.humidity,
      Wind: data.wind.speed
    });
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    res.render('weather', {
      City: "Location not found",
      Country: "",
      Temperature: "N/A",
      Humidity: "N/A",
      Wind: "N/A"
    });
  }
});

// Daily summary route
app.get('/daily-summary', async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const summaries = await Weather.aggregate([
    { $match: { timestamp: { $gte: new Date(today) } } },
    {
      $group: {
        _id: "$city",
        avgTemp: { $avg: "$temperature" },
        maxTemp: { $max: "$temperature" },
        minTemp: { $min: "$temperature" }
      }
    }
  ]);
  res.render('summary', { summaries });
});

// Schedule weather data fetching every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  const cities = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];

  cities.forEach(async (city) => {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.API_KEY}`;

    try {
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data.cod !== 200) {
        throw new Error(data.message); // Handle API errors
      }

      const temperature = (data.main.temp - 273.15).toFixed(2); // Convert from Kelvin to Celsius

      await Weather.create({
        city: data.name,
        temperature: temperature,
        humidity: data.main.humidity,
        wind: data.wind.speed
      });

      if (temperature > 35) sendAlert(data.name, temperature);
    } catch (error) {
      console.error(`Error fetching data for ${city}:`, error.message);
    }
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
