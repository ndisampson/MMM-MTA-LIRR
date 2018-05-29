Module.register("MMM-MTA-LIRR",{
  // Default module config.
  defaults: {
    updateInterval: 30000, // update every 30 seconds 
    station: 'FHL',        // station Code (see stations.json)
    direction: 'W',        // E/W: Eastbound or Westbound
    departuresToShow: 2,   // for train schedule
    statusUrl: 'https://traintime.lirr.org/api/MTAStatus',
    scheduleUrl: 'https://traintime.lirr.org/api/Departure',
  },

  // Override dom generator.
  getDom: function() {
    var wrapper = document.createElement("div");
    var divSchedule = document.createElement("div");
    var divStatus = document.createElement("div");

    if(!this.loaded) {
      wrapper.innerHTML = "LOADING...";
      wrapper.className = "dimmed light small";
    }
    if(this.moduleError) {
      wrapper.innerHTML = this.moduleError;
      wrapper.className = "dimmed light xsmall error";
      return wrapper;
    }

    // train station schedule and servic status
    wrapper.className = "lirr-schedule small thin light";
    divStatus.className = "lirr-status";

    divSchedule.innerHTML = this.schedule;
    divStatus.innerHTML = this.status;
    
    wrapper.appendChild(divSchedule);
    wrapper.appendChild(divStatus);
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

    this.schedule = "Loading schedule for the next " + this.config.departuresToShow + " trains...";
    this.status = "Loading service status...";

    // Service info update timer.
    self.sendSocketNotification("GET_DATA");
    setInterval(function() {
      self.error = '';
      self.sendSocketNotification("GET_DATA");
    }, self.config.updateInterval);
    this.loaded = true;
  }, 

  socketNotificationReceived: function(notification, payload) {
    if (notification === "ERROR") {
      this.error = payload;
    } else if (notification === "SCHEDULE_DATA") {
      this.updateSchedule(payload);
    } else if (notification === "STATUS_DATA") {
      this.updateStatus(payload);
    }
    this.updateDom();
  },

  updateStatus(data) {
    // LIRR has different naming conventions for branches in the
    // API's AllStations endpoint vs. their Status endpoint.
    // Surprise, surprise...
    const myBranch = this.branch.replace(' Branch', '');
    const statusBranches = Object.keys(data.branches);
    let statusBranch = statusBranches.find(b => b === myBranch) || 
      statusBranches.find(b => b.match(myBranch.split(' ')[0]))

    const branch = data.branches[statusBranch];
    this.status = `${statusBranch} ${branch.status}<br />${branch.text}`; // text = service alerts
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
      const scheduled = moment(t.SCHED);
      const scheduledText = `<span class="title bright">${scheduled.format('h:mm A')}</span>`
      const stops = t.STOPS.length + (t.STOPS.length > 1 ? " stops" : " stop");
      const minutesLate = moment(t.ETA).diff(moment(t.SCHED), 'minutes');
      var delay = ""

      if(minutesLate > 0) {
        delay = `<span class="lirr-delay">  delayed ${minutesLate}m</span>`;
      }

      self.schedule += `${scheduledText} ${this.stationName} to ${this.getStationName([t.DEST])} `;
      self.schedule += `(${stops}${delay})<br>`;
    });
  },

  getStationName: function(code) {
    return this.stations[code].name;
  },

  fetchStations: function() {
    var self = this;
    fetch('modules/MMM-MTA-LIRR/station_codes.json')
      .then(res => res.json())
      .then(stations => {
        self.stations = stations;
        self.branch = stations[self.config.station].branch
        self.stationName = stations[self.config.station].name
        if(!this.stations[this.config.station]) {
          this.moduleError = `Invalid station code: '${this.config.station}'`;
        } else if(!stations) {
          this.moduleError = "Error loading stations."
        }
      })
  },
});