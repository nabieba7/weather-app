import React, { useEffect, useReducer, useState, useCallback, useMemo } from "react";
import { BiSearch, BiHistory, BiTrash } from "react-icons/bi";
import { FaLocationDot, FaWind, FaWater, FaEye, FaTemperatureHigh } from "react-icons/fa6";
import { WiHumidity, WiBarometer } from "react-icons/wi";
import { useDispatch, useSelector } from "react-redux";
import { fetchForecastByCity } from "../redux/weatherSlice";
import debounce from "lodash.debounce";
import { motion, AnimatePresence } from "framer-motion";

import sunnyImage from "../assets/sunny.jpg";
import rainImage from "../assets/rain.jpg";
import snowImage from "../assets/snow.jpg";
import cloudImage from "../assets/cloud.jpg";

const historyReducer = (state, action) => {
  switch (action.type) {
    case "ADD":
      const newState = state.filter(
        (item) => item.city.toLowerCase() !== action.payload.city.toLowerCase()
      );
      return [action.payload, ...newState].slice(0, 10);
    case "CLEAR":
      return [];
    case "REMOVE":
      return state.filter((item) => item.id !== action.payload);
    case "LOAD":
      return action.payload;
    default:
      return state;
  }
};

function Weather() {
  const [city, setCity] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, dispatchHistory] = useReducer(historyReducer, []);
  const [isCelsius, setIsCelsius] = useState(true);
  const [isDaytime, setIsDaytime] = useState(true);

  const dispatch = useDispatch();
  const { forecast, status, error } = useSelector((state) => state.weather);

  // Load saved data on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("weatherSearchHistory");
    const savedUnit = localStorage.getItem("temperatureUnit");
    
    if (savedHistory) {
      try {
        dispatchHistory({ type: "LOAD", payload: JSON.parse(savedHistory) });
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    
    if (savedUnit) setIsCelsius(savedUnit === "celsius");
    if (!savedHistory || JSON.parse(savedHistory).length === 0) {
      dispatch(fetchForecastByCity("New York"));
    }
  }, [dispatch]);

  // Save data when changed
  useEffect(() => {
    localStorage.setItem("weatherSearchHistory", JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem("temperatureUnit", isCelsius ? "celsius" : "fahrenheit");
  }, [isCelsius]);

  // Check if it's daytime
  useEffect(() => {
    if (forecast?.location?.localtime) {
      const hour = new Date(forecast.location.localtime).getHours();
      setIsDaytime(hour >= 6 && hour < 18);
    }
  }, [forecast]);

  // Debounced search with caching
  const debouncedSearch = useCallback(
    debounce((searchTerm) => {
      if (!searchTerm.trim()) return;
      
      // Check cache first
      const cachedResult = searchHistory.find(item => 
        item.city.toLowerCase() === searchTerm.toLowerCase()
      );
      
      if (cachedResult) {
        dispatch(fetchForecastByCity.fulfill(cachedResult.data));
        return;
      }

      dispatch(fetchForecastByCity(searchTerm))
        .unwrap()
        .then((data) => {
          dispatchHistory({
            type: "ADD",
            payload: {
              id: Date.now(),
              city: searchTerm.trim(),
              timestamp: new Date().toISOString(),
              data // Cache the data
            },
          });
        })
        .catch(() => {});
      
      setCity("");
      setShowHistory(false);
    }, 500),
    [dispatch, searchHistory]
  );

  const handleSearch = () => debouncedSearch(city);

  const handleHistorySearch = useCallback(
    (historyCity) => {
      dispatch(fetchForecastByCity(historyCity));
      setShowHistory(false);
    },
    [dispatch]
  );

  const clearHistory = () => dispatchHistory({ type: "CLEAR" });
  const removeHistoryItem = (id) => dispatchHistory({ type: "REMOVE", payload: id });
  const toggleUnit = () => setIsCelsius(!isCelsius);

  const weatherCondition = forecast?.current?.condition?.text?.toLowerCase();
  
  // Background image based on weather condition
  let backgroundImage = sunnyImage;
  if (weatherCondition) {
    if (weatherCondition.includes("sunny") || weatherCondition.includes("clear")) {
      backgroundImage = isDaytime ? sunnyImage : sunnyImage; // Replace with night image if available
    } else if (weatherCondition.includes("rain")) {
      backgroundImage = rainImage;
    } else if (weatherCondition.includes("snow")) {
      backgroundImage = snowImage;
    } else if (weatherCondition.includes("cloud") || weatherCondition.includes("overcast")) {
      backgroundImage = cloudImage;
    }
  }

  const getTemp = (tempC) => 
    isCelsius ? `${Math.round(tempC)}°` : `${Math.round(tempC * 9/5 + 32)}°`;

  const forecastHours = forecast?.forecast?.forecastday[0]?.hour.slice(0, 10);
  const hourlyForecast = useMemo(() => {
    if (!forecast?.forecast?.forecastday[0]?.hour) return [];
    const now = new Date();
    const currentHour = now.getHours();
    return forecast.forecast.forecastday[0].hour
      .slice(currentHour, currentHour + 24)
      .filter((_, i) => i % 2 === 0); // Show every 2 hours
  }, [forecast]);

  if (status === "loading") {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="error-screen">
        <h2>Weather Unavailable</h2>
        <p>{error || "Unable to fetch weather data"}</p>
        <div className="error-actions">
          <button onClick={() => dispatch(fetchForecastByCity("New York"))}>
            Try New York
          </button>
          {searchHistory.length > 0 && (
            <button onClick={() => handleHistorySearch(searchHistory[0].city)}>
              Try Last Search
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="weather-container"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      {/* Header with search and unit toggle */}
      <header className="app-header">
        <div className="search-box">
          <FaLocationDot className="icon" />
          <input
            type="text"
            placeholder={forecast?.location?.name || "Search city..."}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
          />
          <div className="search-icons">
            {searchHistory.length > 0 && (
              <BiHistory
                className="icon history-icon"
                onClick={() => setShowHistory(!showHistory)}
                title="Search history"
              />
            )}
            <BiSearch className="icon" onClick={handleSearch} />
          </div>
          
          <AnimatePresence>
            {showHistory && searchHistory.length > 0 && (
              <motion.div 
                className="search-history"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="history-header">
                  <h4>Recent Searches</h4>
                  <button onClick={clearHistory} className="clear-history">
                    <BiTrash /> Clear
                  </button>
                </div>
                <ul>
                  {searchHistory.map((item) => (
                    <motion.li 
                      key={item.id}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span onClick={() => handleHistorySearch(item.city)}>
                        {item.city}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHistoryItem(item.id);
                        }}
                        className="remove-item"
                      >
                        ×
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button 
          className="unit-toggle"
          onClick={toggleUnit}
          aria-label={`Show temperature in ${isCelsius ? 'Fahrenheit' : 'Celsius'}`}
        >
          {isCelsius ? '°C' : '°F'}
        </button>
      </header>

      {/* Main weather content */}
      <main className="main-section">
        <div className="weather-info">
          <div className="location">
            <h2>
              {forecast?.location?.name}, {forecast?.location?.country}
            </h2>
            <p>{new Date(forecast?.location?.localtime).toLocaleString()}</p>
          </div>
          <div className="condition">
            <h1>{forecast?.current?.condition?.text}</h1>
            <img 
              src={forecast?.current?.condition?.icon} 
              alt={forecast?.current?.condition?.text} 
            />
          </div>
        </div>

        <div className="temperature-display">
          <h1>{getTemp(forecast?.current?.temp_c)}</h1>
          <p>H: {getTemp(forecast?.forecast?.forecastday[0]?.day.maxtemp_c)} L: {getTemp(forecast?.forecast?.forecastday[0]?.day.mintemp_c)}</p>
        </div>

        {/* Hourly forecast */}
        <div className="weather-hours">
          <h3>Hourly Forecast</h3>
          <div className="hourly-scroll">
            {hourlyForecast.map((hour, i) => (
              <div key={i} className="hour-card">
                <p>{new Date(hour.time).toLocaleTimeString([], { hour: 'numeric' })}</p>
                <img src={hour.condition.icon} alt={hour.condition.text} />
                <p>{getTemp(hour.temp_c)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weather details */}
        <div className="weather-details">
          <h3>Details</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <FaWind />
              <div>
                <p>Wind</p>
                <p>{forecast?.current?.wind_kph} km/h {forecast?.current?.wind_dir}</p>
              </div>
            </div>
            <div className="detail-item">
              <WiHumidity />
              <div>
                <p>Humidity</p>
                <p>{forecast?.current?.humidity}%</p>
              </div>
            </div>
            <div className="detail-item">
              <FaWater />
              <div>
                <p>Precipitation</p>
                <p>{forecast?.current?.precip_mm} mm</p>
              </div>
            </div>
            <div className="detail-item">
              <WiBarometer />
              <div>
                <p>Pressure</p>
                <p>{forecast?.current?.pressure_mb} mb</p>
              </div>
            </div>
            <div className="detail-item">
              <FaEye />
              <div>
                <p>Visibility</p>
                <p>{forecast?.current?.vis_km} km</p>
              </div>
            </div>
            <div className="detail-item">
              <FaTemperatureHigh />
              <div>
                <p>Feels Like</p>
                <p>{getTemp(forecast?.current?.feelslike_c)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 5-day forecast */}
        <div className="forecast-days">
          <h3>5-Day Forecast</h3>
          {forecast?.forecast?.forecastday?.map((day, index) => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const formattedDate = date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            });

            return (
              <div className="forecast-day" key={day.date}>
                <div className="day-header">
                  <span className="day-name">{index === 0 ? 'Today' : dayName}</span>
                  <span className="day-date">{formattedDate}</span>
                </div>
                <div className="day-weather">
                  <img src={day.day.condition.icon} alt={day.day.condition.text} />
                  <span className="day-condition">{day.day.condition.text}</span>
                </div>
                <div className="day-temps">
                  <span className="day-max">{getTemp(day.day.maxtemp_c)}</span>
                  <div className="temp-bar">
                    <div 
                      className="temp-fill" 
                      style={{ 
                        width: `${((day.day.maxtemp_c - day.day.mintemp_c) / 30) * 100}%`,
                        left: `${((day.day.mintemp_c + 10) / 30) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="day-min">{getTemp(day.day.mintemp_c)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default Weather;