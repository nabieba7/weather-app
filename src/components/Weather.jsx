import React, { useEffect, useState } from "react";
import { BiSearch } from "react-icons/bi";
import { BsCloud } from "react-icons/bs";
import { FaLocationDot, FaWind } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { fetchForecastByCity } from "../redux/weatherSlice";

import sunnyImage from "../assets/sunny.jpg";
import rainImage from "../assets/rain.jpg";
import snowImage from "../assets/snow.jpg";
import cloudImage from "../assets/cloud.jpg";

function Weather() {
  const [city, setCity] = useState("");
  const dispatch = useDispatch();
  const { forecast, status, error } = useSelector((state) => state.weather);

  useEffect(() => {
    dispatch(fetchForecastByCity("New York"));
  }, [dispatch]);

  const handleSearch = () => {
    if (city.trim() !== "") {
      dispatch(fetchForecastByCity(city));
    }
  };
  console.log(forecast);

  const forecastHours = forecast?.forecast?.forecastday[0]?.hour.slice(0, 10);

  const weatherCondition = forecast?.current?.condition?.text?.toLowerCase();

  let backgroundImage = sunnyImage;

  if (weatherCondition) {
    if (
      weatherCondition.includes("sunny") ||
      weatherCondition.includes("clear")
    ) {
      backgroundImage = sunnyImage;
    } else if (weatherCondition.includes("rain")) {
      backgroundImage = rainImage;
    } else if (weatherCondition.includes("snow")) {
      backgroundImage = snowImage;
    } else if (
      weatherCondition.includes("cloud") ||
      weatherCondition.includes("overcast")
    ) {
      backgroundImage = cloudImage;
    }
  }

  if (status === 'loading') {
    return <div className="loading">Loading weather data...</div>;
  }

  if (status === 'failed') {
    return <div className="error">Error: {error}</div>;
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

  
      <div className="main-section">
        <div className="weather-info">
          <div className="location">
            <h3>
              {forecast?.location?.name} - {forecast?.location?.country}
            </h3>
          </div>
          <div className="condition">
            <h1>{forecast?.current?.condition?.text}</h1>
          </div>
        </div>

        <div className="weather-hours">
          {forecastHours?.map((hour, index) => {
            const time = new Date(hour.time).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });

            return (
              <div className="hour-card" key={index}>
                <div className="hour-time">
                  <p>{time}</p>
                </div>
                <div className="hour-condition">
                  <img src={hour?.condition.icon} alt="" />
                </div>
                <div className="hour-temp">
                  <h2>{Math.ceil(hour?.temp_c)}°C</h2>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="side-section">
        <div className="search-box">
          <FaLocationDot className="icon" />
          <input
            type="text"
            placeholder={forecast?.location?.name}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <BiSearch className="icon" onClick={handleSearch} />
        </div>

        <div className="temp-info">
          <h1>{Math.ceil(forecast?.current?.temp_c)}°C</h1>
          <p>
            <FaWind /> {forecast?.current?.wind_dir}{" "}
            {forecast?.current?.wind_kph} km/h
          </p>
        </div>

        <div className="forecast-days">
          <h1 className="forecast-heading">5-Day Forecast</h1>
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
                  <span className="day-max">{Math.round(day.day.maxtemp_c)}°</span>
                  <span className="day-min">{Math.round(day.day.mintemp_c)}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Weather;
