import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const DATA_DIR = path.join(import.meta.dirname, 'data') //saves files in the right place
if (!fs.existsSync(DATA_DIR)) { //does datadir exist?
    fs.mkdirSync(DATA_DIR) //if it doesn't, make it
}

const WEATHER_FILE = path.join(DATA_DIR, 'weather.json') //create weather.json file in data dir
const LOG_FILE = path.join(DATA_DIR, 'weather_log.csv') //create weather_log.csv file in data dir

export async function fetchWeather() {
    const apiKey = process.env.WEATHER_API_KEY
    const city = process.env.CITY || 'London'
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`

    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: $(response.status)`)
        }
        const data = await response.json()
        const nowUTC = new Date().toISOString() //returns data in YYYY-MM-DDTHH:MM:SSZ format
        data._last_updated_utc = nowUTC
        fs.writeFileSync(WEATHER_FILE, JSON.stringify(data, null, 2)) // writes data from line 23 into weather file, formatted it into a json string with 2 spaces indentation

        const header = 'timestamp,city,temperature,description\n'
        if (!fs.existsSync(LOG_FILE)) {
            fs.writeFileSync(LOG_FILE, header)
        } else {
            const firstLine = fs.readFileSync(LOG_FILE, 'utf-8').split('\n')[0] // splits the file into lines and gets the first line
            if (firstLine !== 'timestamp,city,temperature,description') { //if first line doesn't have the headers
                fs.writeFileSync(LOG_FILE, header + fs.readFileSync(LOG_FILE, 'utf-8')) // write the headers
            }
        }

        const logEntry = `${nowUTC},${city},${data.main.temp},${data.weather[0].description}\n`
        fs.appendFileSync(LOG_FILE, logEntry) //append new log entry to log file

        console.log(`weather data updated for ${city} at ${nowUTC}`);

    } catch (error) {
        console.log('Error fetching weather', err);
    }


}
if (import.meta.url === `file://${process.argv[1]}`) { //import current file url and checking against process.argv (where node is running from)
    fetchWeather()
}
