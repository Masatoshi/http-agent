
var http = require('http')
    path = require('path'),
    sys = require('sys'),
    eyes = require('eyes'),
    events = require('events');

this.agent = function () {
  var args = Array.prototype.slice.call(arguments);

  this.host = args[0];
  this._unvisited = Array.prototype.slice.call(args[1]);

  // TODO: Options or something like that for all the random
  // HTTP settings that cannot be assumed default.

  this._delegate('addListener',       'emitter');
  this._delegate('removeListener',    'emitter');
  this._delegate('removeAllListener', 'emitter');
  this._delegate('listeners',         'emitter');
  this._delegate('emit',              'emitter');

  this.addListener('error', function (e) {
      // TODO: Logging
  });
};

this.create = function(urls, next) {
  return new this.agent(urls, next);
}

this.agent.prototype = {
  url: '',
  data: '',
  emitter:    new(events.EventEmitter),
  encoding: "utf8",
  port: 80,
  _running: false,
  _visited:   [],
  _unvisited: [],

  start: function () {
    if(!this._running) {
      this._running = true;
      this.emit('start', null, this);
      this.next();
    }
  },

  stop: function () {
    if(this._running) {
      this._running = false;
      this.emit('stop', null, this);
    }
  },

  get prevUrls () {
    var self = this;
    return this._visited.map(function (url) {
      return path.join(self.host, url);
    })
  },

  get nextUrls () {
    var self = this;
    return this._unvisited.map(function (url) {
      return path.join(self.host, url);
    });
  },
  
  next: function () {
    if(this._running) {
      // TODO: Be more robust than just 'GET'
      if (this._unvisited.length > 0) {
        this.url = this._unvisited.shift();
        this._makeRequest(this.currentUrl, 'GET');
      }
      else {
        this.stop();
      }
    }
  },

  _makeRequest: function (url, type) {
    var client = http.createClient(80, this.host);
    var request = client.request("GET", "/" + url, {"host": this.host});

    var self = this;
    request.addListener('response', function(response) {
      response.setEncoding(self.encoding);
      self.response = response;

      response.addListener("data", function (chunk) {
        self.data += chunk;
      });
      
      response.addListener("end", function(err, obj) {
        self.emit('next', null, this);
      });
    });
    
    request.end();
  },

  _delegate: function (method, property) {
      var self = this;
      this[method] = function () {
          return self[property][method].apply(self[property], arguments);
      };
  }
}
