import express from 'express'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const DATA_DIR = path.join(import.meta.dirname, 'data')
const WEATHER_FILE = path.join(DATA_DIR, 'weather.json')
const LOG_FILE = path.join(DATA_DIR, 'weather_log.csv')

app.use(express.static(path.join(import.meta.dirname, 'public'))) // tells express to serve all static files (HTML + CSS)
app.get('/api/weather', (req, res) => {
    if (!fs.existsSync(WEATHER_FILE)) {
        return res.status(404).json({ error: 'Weather data not found. Please fetch weather data first.' })
    }

    try {
        const weatherData = JSON.parse(fs.readFileSync(WEATHER_FILE, 'utf-8'))
        res.json(weatherData)
    } catch (err) {
        console.log('Error reading weather.json', err)
        res.status(500).json({ error: 'Failed to read weather data' });
    }
})

app.get('/api/weather-log', (req, res) => {
    if (!fs.existsSync(LOG_FILE)) {
        return res.status(404).json({ error: 'Weather log not found. Please fetch weather data first.' })
    }

    const timestamps = []
    const temps = []

    fs.createReadStream(LOG_FILE)
        .pipe(csv())
        .on('data', (row) => {
            if (row.timestamp && row.temperature) {
                timestamps.push(row.timestamp)
                temps.push(parseFloat(row.temperature))
            }
        })
        .on('end', () => {
            res.json({ timestamps, temps })
        })
        .on('error', (err) => {
            console.log('Error reading CSV', err)
            res.status(500).json({ error: 'Failed to read weather log' });
        })
})

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
})
