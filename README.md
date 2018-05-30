# Magic Mirror Module for the LIRR
This [MagicMirror²](https://github.com/MichMich/MagicMirror/) module displays schedule and service information for a Long Island Railroad station and its corresponding branch.

## Installation
1. [Install or clone](https://github.com/MichMich/MagicMirror#installation) the Magic Mirror App
2. Go to the modules directory: `cd modules`
3. Clone this module repo: `git clone https://github.com/ndisampson/MMM-MTA-LIRR.git`
4. Update the configs (below) and run the server: `cd .. && node serveronly`

## Using The Module
```javascript
{
  module: 'MMM-MTA-LIRR',
  position: 'top_right',
  header: "LIRR STATUS",
  config: {
    station: 'FHL',       // see stations.json
    direction: 'W',       // E/W: Eastbound or Westbound
    departuresToShow: 2,  // number of upcoming departures to display
    mtaAPIKey: ''         // API KEY can be obtained from datamine.mta.info
},
```
## Configuration Options
