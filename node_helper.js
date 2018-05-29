
const NodeHelper = require("node_helper");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({
  config: {},
  statusInfo: {},
  updateTimer: null,

  getData: function() {
    const self = this;
    const urls = {
      "SCHEDULE_DATA": `${this.config.scheduleUrl}?loc=${this.config.station}`,
      "STATUS_DATA": this.config.statusUrl
    }

    // get status information
    Object.keys(urls).map(req => {
      console.log("FETCHING ", urls[req]);
      fetch(urls[req])
        .then(res => res.json())
        .then(statusInfo => self.sendSocketNotification(req, statusInfo))
        .catch(error => {
          console.log(error);
          self.sendSocketNotification("ERROR", error)
        });
    })
  },

  socketNotificationReceived: function(notification, payload) {
    const self = this;
    if (notification === "CONFIG") {
      console.log("SETTING CONFIG: ", payload);
      self.config = payload;
    } else if (notification === "GET_DATA") {
      self.getData();
    }
  }, 

  // fetch polyfill (to avoid loading an external module)
  fetch: function get(url) { 
    return new Promise(function(resolve, reject) {
      const req = new XMLHttpRequest();
      req.open('GET', url);
      req.onload = () => {
        if (req.status == 200) {
          resolve(req.response);
        }
        else {
          // Otherwise reject with the status text
          // which will hopefully be a meaningful error
          reject("ERROR " + req.statusText);
        }
      };
      // Handle network errors
      req.onerror = function() {
        reject("Network Error");
      };
      // Make the request
      req.send();
    });
  }
});