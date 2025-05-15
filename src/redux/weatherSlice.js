// weatherSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_KEY = "4d98b984bb1f47eca38153016241912";
const BASE_URL = "http://api.weatherapi.com/v1";

export const fetchForecastByCity = createAsyncThunk(
  "weather/fetchForecastByCity",
  async (city) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/forecast.json?key=${API_KEY}&q=${city}&days=5&aqi=no&alerts=no`
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch weather data');
    }
  }
);

const weatherSlice = createSlice({
  name: "weather",
  initialState: {
    forecast: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchForecastByCity.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchForecastByCity.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.forecast = action.payload;
        state.error = null;
      })
      .addCase(fetchForecastByCity.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export default weatherSlice.reducer;