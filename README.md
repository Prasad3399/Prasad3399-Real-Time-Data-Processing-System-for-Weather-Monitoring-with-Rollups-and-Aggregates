# Prasad3399-Real-Time-Data-Processing-System-for-Weather-Monitoring-with-Rollups-and-Aggregates
This is a weather data application built using Node.js, Express, MongoDB, and Axios. It allows users to:

Fetch current weather information for cities.
Save weather data to MongoDB.
Trigger alerts when temperature exceeds a threshold (35°C).
View daily weather summaries.
Email notifications using Gmail.

**Features**
Get real-time weather data using OpenWeather API.
Store fetched data in MongoDB using Mongoose ORM.
Automated alerts sent via Nodemailer.
Cron job that fetches data every 5 minutes for multiple cities.
Daily weather summary through aggregation.
