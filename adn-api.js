var request = require('request');
var qs = require('querystring');
var sys = require('util');

module.exports.ADNAPI = function(access_token) {

  var self = this;


  this.api_base = "https://alpha-api.app.net:443/stream/0/";
  this.host = "alpha.app.net";
  this.port = 443;
  this.api_path_base = "stream/0/";
  this.access_token = access_token;

  var requestCallback = function(callback) {
    return function(err, res, data) {
      if (err) {
        callback(err, res, data);
      } else {
        callback(null, res, JSON.parse(data));
      }
    };
  };

  // hack to properly encode utf chars
  var JSON_stringify = function(s, emit_unicode) {
    var json;
    json = JSON.stringify(s);
    if (emit_unicode) {
      return json;
    }
    return json.replace(/[\u007f-\uffff]/g, function(c) {
      return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
    });
  };


  var get = function(path, params, callback) {
    console.log("path: " + path);
    if (arguments.length == 2) {
      callback = params;
      params = {access_token: self.access_token};
    } else {
      if (!params.access_token) {
        params.access_token = self.access_token;
      }
    }
    var full_path = self.api_base + path + "?" + qs.stringify(params);
    console.log(full_path);
    request(full_path, requestCallback(callback));
  };

  var post = function(path, params, callback) {
    console.log('hi');
    if (!params.access_token) {
        params.access_token = self.access_token;
    }
    if (!params.annotations) {
      delete params.annotations;
    }
    console.log('there');
    var opts = {
      uri: self.api_base + path,
      method: "POST",
      headers: {
        "Authorization": "Bearer " + params.access_token,
        "Content-type": "application/json"
      },
      body: JSON_stringify(params)
    };
    console.log(sys.inspect(opts));
    var finalCallback = requestCallback(callback);
    request(opts, finalCallback);

  };

  this.getUser = function (callback) {
    get("users/me", callback);
  };

  this.postStatus = function(statusText, extras, callback) {
    post("posts?include_annotations=1", {text: statusText, annotations: extras.annotations, entities: extras.entities}, callback);
  };

  this.getStatus = function(idStr, callback) {
    get("posts/" + idStr, {include_annotations: 1}, callback);
  };

  this.getReplies = function(idStr, callback) {
    get("posts/" + idStr + "/replies", {include_annotations: 1}, callback);
  };
};