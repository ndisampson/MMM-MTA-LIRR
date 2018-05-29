const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const stationsUrl = "https://traintime.lirr.org/api/StationsAll";
const STATIONS_FILE = path.join(__dirname, "stations.json");
const STATION_CODES_FILE = path.join(__dirname, "station_codes.json");

console.log("downloading from " + stationsUrl);
fetch(stationsUrl)
  .then(response => response.json())
  .then(data => processResponse(data))
  .catch(e => console.log(e))

function processResponse(data) {
  let stations = {};

  console.log(`Saving file ${STATIONS_FILE}...`);
  fs.writeFile(STATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');

  console.log("Parsing " + Object.keys(data.Stations).length + " items...");

  Object.keys(data.Stations).map(i => {
    station = data.Stations[i];
    console.log(station.ABBR)
    stations[station.ABBR] = {
      name: station.NAME,
      branch: station.BRANCH,
    }
  });

  console.log("Writing output /station_codes.json");
  fs.writeFile(STATION_CODES_FILE, JSON.stringify(stations, null, 2) , 'utf-8');
}

