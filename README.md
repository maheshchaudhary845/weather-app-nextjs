# 🌦️ Weather App - Next.js

A modern Weather Forecasting Web App built with **Next.js**.  
It provides real-time weather updates, 5-day forecasts, sunrise/sunset timings, and location-based search with autocomplete.

> This project was developed as part of an internship project.

## 🚀 Live Demo

👉 [Weather App on Vercel](https://weather-black-three.vercel.app/)

## ✨ Features

- 🌍 Search weather by city, state, or country  
- 📍 Auto-detect location using browser geolocation  
- ⏱️ Real-time weather updates (temperature, humidity, wind speed, precipitation)  
- 📅 5-Day forecast with min/max temperature and weather icons  
- 🌅 Sunrise and sunset timings  
- 💾 Local storage caching to reduce API calls  
- 🎨 Responsive and modern UI with animations  

## 🛠️ Tech Stack

- **Next.js** – React framework  
- **Tailwind CSS** – Styling  
- **OpenWeatherMap API** – Weather data  
- **Motion** – Animations  
- **i18n-iso-countries** – Country names  

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/weather-app-nextjs.git
cd weather-app-nextjs
```

**2. Install dependencies**  
```bash 
npm install
```

**3. Get API Key**  
- Sign up at [OpenWeatherMap](https://home.openweathermap.org/users/sign_up) 
- Generate an API key from your dashboard

**4. Add API Key to `.env.local`**  
Create a file named `.env.local` in the root directory and add this line:  
```bash 
NEXT_PUBLIC_WEATHER_API_KEY=your_api_key_here
```

**5. Run development server**  
```bash 
npm run dev  
```
App will be running at: http://localhost:3000

---

# 📦 Deployment (Vercel)

This project is optimized for Vercel deployment:

1. Push your repo to GitHub  
2. Go to Vercel  
3. Import the GitHub repository  
4. Add `NEXT_PUBLIC_WEATHER_API_KEY` in Vercel project settings under Environment Variables  
5. Deploy 🎉

---

# 📸 Screenshots

_Add screenshots of the app here (homepage, forecast section, etc.)_

![Homepage](./screenshots/home.png)  
![Forecast](./screenshots/forecast.png)

---

# 👨‍💻 Author

**Mahesh Chaudhary**  
💼 B.Tech CSE Graduate (2024) | Web Developer

---

# 📜 License

This project is licensed under the **MIT License** – feel free to use, modify, and share.
