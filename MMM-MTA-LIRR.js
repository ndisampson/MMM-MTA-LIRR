Module.register("MMM-MTA-LIRR",{
  // Default module config.
  defaults: {
    updateInterval: 5000, // update every 3 seconds 
    station: 'FHL',       // station Code (see stations.json)
    statusUrl: 'https://traintime.lirr.org/api/MTAStatus',
    scheduleUrl: 'https://traintime.lirr.org/api/Departure',
    departuresToShow: 2,
    direction: 'W'        // E/W: Eastbound or Westbound
  },

  // Override dom generator.
  getDom: function() {
    var wrapper = document.createElement("div");
    var divSchedule = document.createElement("div");

    if(!this.loaded) {
      wrapper.innerHTML = "LOADING...";
      wrapper.className = "dimmed light small";
    }

    if(this.moduleError) {
      wrapper.innerHTML = this.moduleError;
      wrapper.className = "dimmed light xsmall error";
      return wrapper;
    }

    // train station schedule
    divSchedule.className = "lirr-schedule xsmall thin light";
    divSchedule.innerHTML = this.schedule;
    wrapper.appendChild(divSchedule);
    return wrapper;
  },

  getStyles: function() {
    return ['MMM-MTA-LIRR.css'];
  },

  start: function() {
    var self = this;
    var dataRequest = null;
    var dataNotification = null;

    console.log(`Starting module: ${this.name}`);
    this.fetchStations();
    this.sendSocketNotification("CONFIG", {...this.config, ...this.defaults});

    this.schedule = "Loading schedule for the next " + this.config.departuresToShow + " trains..."
    // Schedule update timer.
    setInterval(function() {
      self.error = '';
      self.sendSocketNotification("GET_DATA");
    }, self.config.updateInterval);
    this.loaded = true;
  }, 

  socketNotificationReceived: function(notification, payload) {
    if(notification === "DATA") {
      this.updateSchedule(payload);
    } else if (notification === "ERROR") {
      this.error = payload;
    }
    this.updateDom();
  },

  updateSchedule: function(data) {
    const self = this;
    this.schedule = "";
    if(!data.TRAINS) {
      this.schedule = "Error retrieving trains: " & data.responstText;
      return;
    }
    const departures = [];
    const trains = data.TRAINS.filter((t, i) => t.DIR === 'W').slice(0, this.config.departuresToShow);
    trains.map(t => {
      console.log(t);
      const scheduled = moment(t.SCHED);
      const scheduledText = `<span class="title bright">${scheduled.format('h:mm A')}</span>`
      const stops = t.STOPS.length + (t.STOPS.length > 1 ? " stops" : " stop");
      const minutesLate = moment(t.ETA, 'h:mm:ss a').diff(scheduled, 'minutes');
      var delay = ""

      if(minutesLate > 1) {
        delay = `<span class="warning"> DELAYED ${minutesLate} MINUTES</span>`;
      }

      self.schedule += `${scheduledText} ${this.origin} to ${this.stations[t.DEST]} `;
      self.schedule += `(${stops}${delay})<br>`;
    });
  },

  fetchStations: function() {
    var self = this;
    fetch('modules/MMM-MTA-LIRR/stations.json')
      .then(res => res.json())
      .then(stations => {
        self.stations = stations;
        self.origin = self.stations[self.config.station];

        if(!this.stations[this.config.station]) {
          this.moduleError = `Invalid station code: '${this.config.station}'`;
        } else if(!stations) {
          this.moduleError = "Error loading stations."
        }
      })
  },
});