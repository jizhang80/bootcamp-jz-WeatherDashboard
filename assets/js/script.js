
/*
API call example: 
weather call by coordinator
https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API key}

coordinator call by city, state code and country code
http://api.openweathermap.org/geo/1.0/direct?
q={city name},{state code},{country code}&limit={limit}&appid={API key}
*/

const API_KEY = '9fb0afebf2cfd351df38dea344f04d10';
const STORAGE_KEY = 'weather_dashboard_city_list'; // localstorage key

// define CityWeather object, by default is Ottawa
let cityWeatherObj = {
   city_name: 'Ottawa', // city name: London
   city_csc: 'Ottawa, ON, Canada', // city, state, country: London, ON, Canada
   lat: '45.4215296',
   lon: '-75.69719309999999',
   weather: '', // current weather object
   weather5Days: ''
}

cityWeatherObj.setCity = function(city_name, city_csc, lat, lon) {
   // set city info except weather info
   this.city_name = city_name;
   this.city_csc = city_csc;
   this.lat = lat;
   this.lon = lon;
}

cityWeatherObj.setCityLoc = function(lat, lon) {
   this.lat = lat;
   this.lon = lon;
   let geo_location_url = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
   fetch(geo_location_url)
   .then(response => response.json())
   .then(data=>{
      //update city name
      cityWeatherObj.city_name = data[0].name;
   })
}

cityWeatherObj.setWeatherByLocation = function () {
   let weather_fetch_url = `https://api.openweathermap.org/data/2.5/weather?lat=${cityWeatherObj.lat}&lon=${cityWeatherObj.lon}&appid=${API_KEY}&temp=Fahrenheit`;
   fetch(weather_fetch_url)
   .then(response => response.json())
   .then(data => {
      cityWeatherObj.weather = data; // set weather info
      // show weather to screen
      showWeather();
   });
}

cityWeatherObj.setWeather5DaysByLocation = function() {
   let weather_fetch_url = `https://api.openweathermap.org/data/2.5/forecast?lat=${cityWeatherObj.lat}&lon=${cityWeatherObj.lon}&appid=${API_KEY}`;
   
   fetch(weather_fetch_url)
   .then(response => response.json())
   .then(data => {
      cityWeatherObj.weather5Days = data; // set weather info
      // show weather to screen
      showWeather5Days();
   });
}

cityWeatherObj.setWeather = function() {
   this.setWeatherByLocation();
   this.setWeather5DaysByLocation();
}

cityWeatherObj.getCityName = function() {
   return this.city_name;
}

cityWeatherObj.getCityCSC = function() {
   return this.city_csc;
}

cityWeatherObj.getDate = function() {
   let now = `(${dayjs().format('YYYY-MM-DD')})`;
   return now;
}

cityWeatherObj.getIcon = function() {
   return make_icon(this.weather.weather[0].icon)
}

cityWeatherObj.getTemp = function() {
   return `Temp: ${convertKToF(this.weather.main.temp)} °F`;
}

cityWeatherObj.getWind = function() {
   return `Wind: ${this.weather.wind.speed} MPH`;
}

cityWeatherObj.getHumidity = function() {
   return `Humidity: ${this.weather.main.humidity} %`;
}

cityWeatherObj.get5DaysList = function() {
   //there are 40 items in the 5 Days forecast data, 
   //we need each day noon one, which means indexes are 3, 11, 19, 27, 35
   return [
      cityWeatherObj.weather5Days.list[3],
      cityWeatherObj.weather5Days.list[11],
      cityWeatherObj.weather5Days.list[19],
      cityWeatherObj.weather5Days.list[27],
      cityWeatherObj.weather5Days.list[35],
   ];
}


// search btn
function searchCity(event) {
   event.preventDefault();
   cityWeatherObj.setWeather();
   // save to search record to localstorage
   saveLocalStorage();
 }

function showWeather() {
   // display weather info to the right, create city card
   const cityNameSpan = document.getElementById('city-name');
   cityNameSpan.innerHTML = cityWeatherObj.getCityName();

   const cityDateSpan = document.getElementById('city-date');
   cityDateSpan.innerHTML = cityWeatherObj.getDate();

   const weatherIconSpan = document.getElementById('weather-icon');
   weatherIconSpan.innerHTML = ''; // clear pre content
   weatherIconSpan.appendChild(cityWeatherObj.getIcon());

   const cityTemp = document.getElementById("city-temperature");
   cityTemp.innerHTML = cityWeatherObj.getTemp();

   const cityWind = document.getElementById("city-wind");
   cityWind.innerHTML = cityWeatherObj.getWind();

   const cityHumidity = document.getElementById("city-humidity");
   cityHumidity.innerHTML = cityWeatherObj.getHumidity();
}

function showWeather5Days() {
   // display weather 5 days forecast
   const list5Days = cityWeatherObj.get5DaysList();
   const forecastDiv = document.getElementById("forecast-cards");
   // clear forecast div
   forecastDiv.innerHTML = '';
   for (let i of list5Days) {
      forecastDiv.appendChild(make_card(i));
   }
}

// start here
loadCity(); // load btns
cityWeatherObj.setWeather();

//block input enter keyboard
let form = document.getElementById("search-form")
form.addEventListener('keypress', function(event) {
   if (event.code === "Enter") {
         event.preventDefault();
     }
 });

// get city info by input
// after input the city name, then select the city from dropdown list, 
// then the city object will be created.
let input = document.getElementById('search-input');
input.addEventListener('keypress', function(event) {
   if (event.code === "Enter") {
         event.preventDefault();
     }
 });
let autocomplete = new google.maps.places.Autocomplete(input,{types: ['(cities)']});
function setCityFromSearch() {
   let place = autocomplete.getPlace();
   cityWeatherObj.setCity(
      place.name, 
      place.formatted_address, 
      place.geometry.location.lat(), 
      place.geometry.location.lng()
      )
}
google.maps.event.addListener(autocomplete, 'place_changed', setCityFromSearch);

// set city info by click search btn
let citySearchBtn = document.getElementById('city_search');
citySearchBtn.addEventListener('click', searchCity);

// set city info by click city btn
let citySearchHistoryZone = document.getElementById("city-list");
citySearchHistoryZone.addEventListener('click', loadCityFromBtn)

function loadCityFromBtn(event) {
   const btn =event.target;
   console.log(btn, btn.dataset.name, btn.dataset.csc, btn.dataset.lat, btn.dataset.lon)
   cityWeatherObj.setCity(
      btn.dataset.name, 
      btn.dataset.csc, 
      btn.dataset.lat, 
      btn.dataset.lon)
   cityWeatherObj.setWeather();
}


// components tools function
function make_btn(city_name, csc, lat, lon) {
   //make btn by city_name
   const btn = document.createElement('button');
   btn.className = 'btn-gray w-full';
   btn.textContent = city_name;
   btn.setAttribute('data-name', city_name);
   btn.setAttribute('data-csc', csc);
   btn.setAttribute('data-lat', lat);
   btn.setAttribute('data-lon', lon);
   return btn;
}

function make_card(forecastData) {
   //make a card from weather info
   const cardDiv = document.createElement('div');
   cardDiv.className = "weather-card m-2";

   const cardTitleDiv = document.createElement('div');
   cardTitleDiv.className = "card-title";
   cardTitleDiv.innerHTML = dayjs(forecastData.dt_txt).format('YYYY-MM-DD');

   const cardIconDiv = document.createElement('div');
   cardIconDiv.appendChild(make_icon(forecastData.weather[0].icon));

   const cardTemp = document.createElement('div');
   cardTemp.className = "card-temperature";
   cardTemp.innerHTML = `Temp: ${forecastData.main.temp} °F`;

   const cardWind = document.createElement('div');
   cardWind.className = "card-wind";
   cardWind.innerHTML = `Wind ${forecastData.wind.speed} MPH`;

   const cardHumidity = document.createElement('div');
   cardHumidity.className = "card-humidity";
   cardHumidity.innerHTML = `Humidity ${forecastData.main.humidity} %`;

   cardDiv.appendChild(cardTitleDiv);
   cardDiv.appendChild(cardIconDiv);
   cardDiv.appendChild(cardTemp);
   cardDiv.appendChild(cardWind);
   cardDiv.appendChild(cardHumidity);

   return cardDiv;
}

function make_icon(icon_code) {
   // return icon img element
   let img = document.createElement('img');
   img.setAttribute('src', `http://openweathermap.org/img/w/${icon_code}.png`)
   return img;
}

function convertKToF(K) {
   return Math.round((9/5*(K-273)+32)*100)/100;
}

function saveLocalStorage() {
   let storageList = JSON.parse(localStorage.getItem(STORAGE_KEY));
   if (!storageList) {
      storageList=[];
   } else {
      for (let c of storageList) {
         if (c.city_csc === cityWeatherObj.city_csc) {
            return; // if already has the city
         }
      }
   }
   storageList.push({
      city_name: cityWeatherObj.city_name,
      city_csc: cityWeatherObj.city_csc,
      lat: cityWeatherObj.lat,
      lon: cityWeatherObj.lon
   })
   localStorage.setItem(STORAGE_KEY, JSON.stringify(storageList));

   // create history btn
   const cityList = document.getElementById('city-list');
   const liEl = document.createElement('li');
   liEl.className = 'my-2';
   liEl.appendChild(make_btn(cityWeatherObj.city_name, cityWeatherObj.city_csc, cityWeatherObj.lat, cityWeatherObj.lon));
   cityList.appendChild(liEl);
}

function loadCity() {
   let cityList = JSON.parse(localStorage.getItem(STORAGE_KEY));
   if (!cityList) return;
   const cityListEl = document.getElementById('city-list');
   for (let i = cityList.length; i > 0; i--) {
      const liEl = document.createElement('li');
      liEl.className = 'my-2';
      liEl.appendChild(make_btn(cityList[i-1].city_name, cityList[i-1].city_csc, cityList[i-1].lat, cityList[i-1].lon));
      cityListEl.appendChild(liEl);
   }
}