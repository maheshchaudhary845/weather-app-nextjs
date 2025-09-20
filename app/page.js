"use client"
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import countries from "i18n-iso-countries"
import enLocale from "i18n-iso-countries/langs/en.json"
import { motion } from "motion/react"


export default function Home() {
  const [city, setCity] = useState("")
  const [weather, setWeather] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [forecast, setForecast] = useState([])
  const [visible, setVisible] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const ref = useRef(null)

  countries.registerLocale(enLocale)
  const countryName = countries.getName(weather?.sys?.country, "en")


  const time = (timestamp) => {
    const timestampsunrise = timestamp
    const date = new Date(timestampsunrise * 1000)
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM"

    hours = hours % 12;
    hours = hours ? hours : 12;

    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;

    const formattedTime = `${hours}:${formattedMinutes} ${ampm}`
    return formattedTime;
  }

  const feelsLike = () => {
    if (weather?.main?.temp < weather?.main?.feels_like) {
      return "It feels warmer than the actual temperature."
    }
    else if (Math.round(weather?.main?.temp) === Math.round(weather?.main?.feels_like)) {
      return "Similar to the actual temperature."
    }
    else if (weather?.main?.temp > weather?.main?.feels_like) {
      return "It feels colder than the actual temperature."
    }
  }

  const visibility = () => {
    if (weather?.visibility >= 10000) {
      return "Excellent visibility, perfectly clear skies."
    }
    else if (weather?.visibility < 10000 && weather?.visibility >= 5000) {
      return "Moderate visibility, some haze present."
    }
    else {
      return "Low visibility, conditions may be difficult"
    }
  }

  const handleInputKeyDown = (e) => {
    if (suggestions.length === 0) {
      if (e.key === "Enter" && !loading && city.trim().length > 2) {
        handleSearch()
        setSuggestions([])
      }
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
      setVisible(true)
    }
    else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
      setVisible(true)
    }
    else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        const s = suggestions[selectedIndex]
        setSuggestions([])
        handleSearch(s.name, s.lat, s.lon, s.state)
        setCity(s.name)
      } else if (!loading && city.trim().length > 2) {
        handleSearch()
        setSuggestions([])
        setCity("")
      }
    }
    else if (e.key === "Escape") {
      setSuggestions([])
    }
  }

  useEffect(() => {
    setSelectedIndex(-1)
  }, [suggestions])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setVisible(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)

    const savedWeather = JSON.parse(localStorage.getItem("weather"))
    const savedForecast = JSON.parse(localStorage.getItem("forecast"))

    const isValid = (savedWeather && Date.now() < savedWeather.expiry)

    if (isValid && savedForecast) {
      setWeather(savedWeather.data)
      setForecast(savedForecast.processed)
    }
    else {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=metric`)
        const data = await res.json()
        setWeather(data)

        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=metric`)
        const forecastData = await forecastRes.json()
        const processed = processForecast(forecastData.list)
        setForecast(processed)

        localStorage.setItem("weather", JSON.stringify({ data, expiry: Date.now() + 30 * 60 * 1000 }))
        localStorage.setItem("forecast", JSON.stringify({ processed }))
      })
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSearch = async (customCity, lat, lon, state) => {
    setLoading(true)
    try {
      let url;
      let forecastUrl;
      const searchCity = customCity || city;

      if (lat && lon) {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=metric`
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=metric`
      }
      else {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${searchCity}&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=metric`;
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${searchCity}&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&units=metric`;
      }

      const res = await fetch(url)
      const data = await res.json()
      if (data.cod !== 200) {
        setWeather(null);
        setError(data.message || "Something went wrong")
      } else {
        setWeather({ ...data, state: state || "" })
        setError("")
        setCity("")
      }
      // fetching forecast data
      const forecastRes = await fetch(forecastUrl)
      const forecastData = await forecastRes.json()
      if (!forecastData.list) {
        setForecast([])
        return
      }
      const processed = processForecast(forecastData.list)
      setForecast(processed)

      localStorage.setItem("weather", JSON.stringify({ data: { ...data, state: state }, expiry: Date.now() + 30 * 60 * 1000 }))
      localStorage.setItem("forecast", JSON.stringify({ processed }))

    } catch (err) {
      setError("Something went wrong!");
    } finally {
      setLoading(false)
    }
  }

  const processForecast = (list) => {
    const daily = {}

    list.forEach((item) => {
      const date = item.dt_txt.split(" ")[0]

      if (!daily[date]) {
        daily[date] = {
          min: item.main.temp_min,
          max: item.main.temp_max,
          icon: item.weather[0].icon,
          description: item.weather[0].description
        }
      }
      else {
        daily[date].min = Math.min(daily[date].min, item.main.temp_min)
        daily[date].max = Math.max(daily[date].max, item.main.temp_max)
      }
    })
    return Object.entries(daily).slice(0, 5)
  }

  async function fetchSuggestions(query) {
    if (query.length > 2) {
      try {
        const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}`)
        const data = await res.json()
        setSuggestions(data)
        setVisible(true)
      }
      catch (error) {
        console.error(error)
      }
    }
    else {
      setSuggestions([])
    }
  }

  function debounce(func, delay) {
    let timer;

    return function (...args) {
      clearTimeout(timer)

      timer = setTimeout(() => {
        func(...args)
      }, delay)
    }
  }

  const debouncedFetch = useMemo(() => debounce(fetchSuggestions, 500), [])

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setCity(value)
    debouncedFetch(value)
  }

  return (
    <>
      <header>
        <nav className="flex flex-col gap-2 md:flex-row justify-between px-4 my-1 sm:px-10 h-12 items-center">
          <div className="logo text-xl font-bold flex gap-2 items-center">
            <img src="/cloudy.gif" alt="weather logo" className="w-10 h-10 rounded-full" />
            <span>Weather App</span>
          </div>
          <div className="flex items-center relative">
            <input type="search" value={city} onChange={handleInputChange} placeholder="Type City, State, Country"
              onKeyDown={handleInputKeyDown}
              className="bg-white text-gray-700 text-base rounded-full p-2 sm:w-100 pr-10" />
            <div onClick={!loading && city.trim().length > 2 ? () => handleSearch(city) : undefined} className={`absolute flex items-center justify-center right-1 rounded-full w-8 h-8 cursor-pointer ${loading ? "bg-gray-500 cursor-not-allowed" : "bg-sky-900"
              }`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="#ffffff" fill="none">
                <path d="M15 15L16.5 16.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16.9333 19.0252C16.3556 18.4475 16.3556 17.5109 16.9333 16.9333C17.5109 16.3556 18.4475 16.3556 19.0252 16.9333L21.0667 18.9748C21.6444 19.5525 21.6444 20.4891 21.0667 21.0667C20.4891 21.6444 19.5525 21.6444 18.9748 21.0667L16.9333 19.0252Z" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16.5 9.5C16.5 5.63401 13.366 2.5 9.5 2.5C5.63401 2.5 2.5 5.63401 2.5 9.5C2.5 13.366 5.63401 16.5 9.5 16.5C13.366 16.5 16.5 13.366 16.5 9.5Z" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {suggestions.length > 0 && (
              <div ref={ref} className={`absolute ${!visible && "hidden"} top-full mt-1 bg-white text-black rounded-lg overflow-hidden shadow-lg w-full z-10`} role="listbox">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSuggestions([]);
                      handleSearch(s.name, s.lat, s.lon, s.state);
                      setCity(s.name);
                    }}
                    role="option"
                    aria-selected={selectedIndex === i}
                    onMouseEnter={() => setSelectedIndex(i)}
                    onMouseLeave={() => setSelectedIndex(-1)}
                    className={`px-4 py-2 cursor-pointer ${i === selectedIndex ? "bg-gray-300" : "hover:bg-gray-200"}`}
                  >
                    {s.name}, {s.state ? s.state + ", " : ""}{countries.getName(s?.country, "en")}
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>
      </header>

      <main>
        {loading &&
          <>
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] z-50">
              <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </>
        }

        {error
          ?
          <p className="text-red-500 text-center max-w-4xl mx-2 md:mx-auto my-15 p-4 space-y-2 shadow-lg bg-white/20 backdrop-blur-xs rounded-xl">{error}</p>
          :
          (!weather
            ?
            <p className="text-gray-300 text-center max-w-4xl mx-2 md:mx-auto my-15 p-4 space-y-2 shadow-lg bg-white/20 backdrop-blur-xs rounded-xl text-sm">Allow location or search for a city to see the weather.</p>
            :
            <div className="overflow-hidden">
              <motion.section
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="max-w-4xl md:mx-auto mx-2 my-15 p-4 space-y-2 shadow-lg bg-white/20 backdrop-blur-xs rounded-xl">
                <div className="cont space-y-4">
                  <div className="location flex justify-center items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35" color="#ffffff" fill="none">
                      <path d="M13.6177 21.367C13.1841 21.773 12.6044 22 12.0011 22C11.3978 22 10.8182 21.773 10.3845 21.367C6.41302 17.626 1.09076 13.4469 3.68627 7.37966C5.08963 4.09916 8.45834 2 12.0011 2C15.5439 2 18.9126 4.09916 20.316 7.37966C22.9082 13.4393 17.599 17.6389 13.6177 21.367Z" stroke="#ffffff" strokeWidth="2" />
                      <path d="M15.5 11C15.5 12.933 13.933 14.5 12 14.5C10.067 14.5 8.5 12.933 8.5 11C8.5 9.067 10.067 7.5 12 7.5C13.933 7.5 15.5 9.067 15.5 11Z" stroke="#ffffff" strokeWidth="2" />
                    </svg>
                    <h1 className="text-center text-pretty text-xl sm:text-3xl font-semibold text-shadow-md">{weather?.name?.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}, {weather.state ? weather?.state + "," : ""} {countryName}</h1>
                  </div>
                  <h2 className="text-5xl sm:text-8xl font-bold text-center text-shadow-lg">{Math.round(weather?.main?.temp)}°c</h2>
                  <h2 className="text-lg font-semibold text-center text-gray-200">Feels like: {Math.round(weather.main.feels_like)}°c</h2>
                  <div className="min-max flex justify-center gap-5">
                    <h2 className="font-medium text-gray-300">L: {Math.floor(weather.main.temp_min)}°c</h2>
                    <h2 className="font-medium text-gray-300">H: {Math.round(weather.main.temp_max)}°c</h2>
                  </div>
                  <div className="desc flex flex-col justify-center items-center">
                    <div className="img-cont relative w-25 h-25">
                      {weather?.weather?.[0]?.icon && (
                        <Image
                          className="scale-150"
                          src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                          fill
                          alt="weather icon"
                        />
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-shadow-md capitalize">{weather?.weather?.[0]?.description}</h2>
                  </div>
                  <div className="flex justify-between bg-sky-900/20 backdrop-blur-xs shadow-lg rounded-lg p-2 sm:px-8 mt-10">
                    <div className="prec flex flex-col items-center justify-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="#ffffff" fill="none">
                        <path d="M12 3.5V2" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M12 3.5C11.0608 3.5 7.52791 7.29323 6.97182 12.2037M12 3.5C12.9392 3.5 16.4721 7.29322 17.0282 12.2037M12 3.5C16.9367 3.5 21.0545 6.93552 22 11.5C20.6123 12.7 18.1073 12.4691 17.0282 12.2037M12 3.5C7.06333 3.5 2.94545 6.93552 2 11.5C3.38792 12.7 5.89285 12.4691 6.97182 12.2037M6.97182 12.2037C8.4559 13.0288 10.1718 13.5 12 13.5C13.8282 13.5 15.5441 13.0288 17.0282 12.2037" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M12 13.5V20.5C12 21.3284 11.3284 22 10.5 22C9.67157 22 9 21.3284 9 20.5V20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                      <h2 className="font-semibold">{weather?.rain?.["1h"] ? weather.rain["1h"] + "mm" : weather?.snow?.["1h"] ? weather?.snow?.["1h"] + "mm snow" : "0mm"}</h2>
                      <h3 className="text-sm">Precipitation</h3>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="#ffffff" fill="none">
                        <path d="M3.5 13.678C3.5 9.49387 7.08079 5.35907 9.59413 2.97222C10.9591 1.67593 13.0409 1.67593 14.4059 2.97222C16.9192 5.35907 20.5 9.49387 20.5 13.678C20.5 17.7804 17.2812 22 12 22C6.71878 22 3.5 17.7804 3.5 13.678Z" stroke="#ffffff" strokeWidth="2"></path>
                        <path d="M4 12.284C5.46463 11.8303 8.39159 11.6836 11.9842 13.7016C15.57 15.7157 18.516 14.9984 20 14.1354" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                      <h2 className="font-semibold">{weather?.main?.humidity}%</h2>
                      <h3 className="text-sm">Humidity</h3>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="#ffffff" fill="none">
                        <path d="M2 5.94145C5.5 9.37313 10.5755 7.90241 11.7324 5.94145C11.9026 5.65301 12 5.31814 12 4.96096C12 3.87795 11.1046 3 10 3C8.89543 3 8 3.87795 8 4.96096" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"></path>
                        <path d="M17 8.92814C17 7.31097 18.1193 6 19.5 6C20.8807 6 22 7.31097 22 8.92814C22 9.6452 21.7799 10.3021 21.4146 10.8111C19.3463 14.1915 9.2764 12.9164 4 11.8563" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"></path>
                        <path d="M13.0854 19.8873C13.2913 20.5356 13.8469 21 14.5 21C15.3284 21 16 20.2528 16 19.331C16 19.0176 15.9224 18.7244 15.7873 18.4738C14.4999 15.9925 7.99996 14.3239 2 18.7746" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"></path>
                        <path d="M19 15.5H21" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                      <h2 className="font-semibold">{(weather?.wind?.speed * 3.6).toFixed(1)} Km/h</h2>
                      <h3 className="text-sm">Wind Speed</h3>
                    </div>
                  </div>
                </div>
              </motion.section>

              <section className="max-w-4xl mx-2 md:mx-auto mt-6 p-4 bg-white/10 backdrop-blur-xs rounded-xl">
                <h2 className="text-xl font-semibold mb-4 text-center">5-Day Forecast</h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {forecast.map(([date, info], i) => {
                    return <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.1 }}
                      viewport={{ once: true, amount: 0.2 }}
                      key={i} className="bg-sky-900/20 backdrop-blur-xs rounded-lg p-3 text-center">
                      <p className="font-medium">
                        {new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
                      </p>
                      <Image
                        src={`https://openweathermap.org/img/wn/${info.icon}@2x.png`}
                        width={50}
                        height={50}
                        alt="weather icon"
                        className="mx-auto"
                      />
                      <p className="text-sm capitalize">{info.description}</p>
                      <p className="text-sm font-semibold">{Math.round(info.min)}°c / {Math.round(info.max)}°c</p>
                    </motion.div>
                  })}
                </div>
              </section>

              <section className="max-w-4xl mx-2 md:mx-auto grid grid-cols-2 gap-2 my-4 shadow-lg">
                <motion.div
                  initial={{ x: -50, y: -50, opacity: 0 }}
                  whileInView={{ x: 0, y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  viewport={{ once: true, amount: 0.2 }}
                  className="relative h-40 p-4 shadow-lg rounded-xl overflow-hidden">
                  <div className="absolute -z-10 inset-0 bg-[url('/sunrise.jpg')] bg-center backdrop-blur-xs opacity-30 bg-cover "></div>
                  <div className="flex flex-col text-center gap-6 font-semibold">
                    <span className="sm:text-lg text-shadow-lg">Sunrise</span>
                    <span className="text-3xl text-shadow-lg">{time(weather?.sys?.sunrise)}</span>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ x: 50, y: -50, opacity: 0 }}
                  whileInView={{ x: 0, y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  viewport={{ once: true, amount: 0.2 }}
                  className="relative h-40 p-4 shadow-lg rounded-xl overflow-hidden">
                  <div className="absolute -z-10 inset-0 bg-[url('/sunset.jpg')] bg-center backdrop-blur-xs opacity-30 bg-cover "></div>
                  <div className="flex flex-col text-center gap-6 font-semibold">
                    <span className="sm:text-lg text-shadow-lg">Sunset</span>
                    <span className="text-3xl text-shadow-lg">{time(weather?.sys?.sunset)}</span>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ x: -50, y: 50, opacity: 0 }}
                  whileInView={{ x: 0, y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  viewport={{ once: true, amount: 0.2 }}
                  className="relative h-40 p-4 bg-white/10 backdrop-blur-xs shadow-lg rounded-xl overflow-hidden">
                  <div className="flex flex-col gap-2">
                    <span className="text-shadow-lg font-medium text-gray-200">Feels Like</span>
                    <span className="text-3xl tesm:text-lg text-shadow-lg font-semibold">{Math.round(weather.main.feels_like)}°c</span>
                    <p className="text-sm text-gray-300">{feelsLike()}</p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ x: 50, y: 50, opacity: 0 }}
                  whileInView={{ x: 0, y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  viewport={{ once: true, amount: 0.2 }}
                  className="relative h-40 p-4 bg-white/10 backdrop-blur-xs shadow-lg rounded-xl overflow-hidden">
                  <div className="flex flex-col gap-2">
                    <span className="text-shadow-lg font-medium text-gray-200">Visibility</span>
                    <span className="text-3xl tesm:text-lg text-shadow-lg font-semibold">{Number.isInteger(weather.visibility / 1000) ? weather.visibility / 1000 : (weather.visibility / 1000).toFixed(1)}Km</span>
                    <p className="text-sm text-gray-300">{visibility()}</p>
                  </div>
                </motion.div>
              </section>

              <motion.footer
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.2 }}
                className="max-w-4xl mx-auto mt-8 mb-4 p-2 text-center text-[13px] sm:text-sm text-gray-300 space-y-1"
              >
                <p>
                  &copy; {new Date().getFullYear()} • Made with <span className="opacity-80">❤️</span> and <span className="opacity-80">☕</span> by <span className="font-medium">Mahesh Chaudhary</span>
                </p>
              </motion.footer>
            </div>
          )}

      </main>
    </>
  );
}
