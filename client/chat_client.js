"use strict";

var createClient = function(url) {
    return new ChatClient(url);
};

var ChatClient = function(url) {
    this.url = url;
    this.events = {};
    this.name = null;
    this.ws = null;
};

ChatClient.prototype.on = function(event, listener) {
    if(typeof this.events[event] !== 'object') {
        this.events[event] = [];
    }
    this.events[event].push(listener);
};

ChatClient.prototype.emit = function(event) {
    var i, n, listeners, args = [].slice.call(arguments, 1);
    if(typeof this.events[event] === 'object' ) {
        listeners = this.events[event].slice();
        n = listeners.length;
        for(i=0; i<n; i++) {
            listeners[i].apply(this, args);
        }
    }
};

ChatClient.prototype.signoff = function() {
    let msg = {cmd: 'SIGNOFF'};
    msg['name'] = this.name;
    this.ws.send(JSON.stringify(msg));
    self.emit("signedoff");
};

ChatClient.prototype.signon = function(name) {
    this.ws = new WebSocket(this.url);
    this.name = name;
    let self = this;
    this.ws.onopen = function() {
        console.log("ws opened");
        let msg = {cmd: 'ON'};
        msg['name'] = name;
        self.ws.send(JSON.stringify(msg));
        self.emit("signedon");
    };
    this.ws.onmessage = function(e) {
        let msg = JSON.parse(e.data);
        self.emit(msg.cmd, msg);
    };
    this.ws.onclose = function () {
        console.log("[WebSocket#onclose]\n");
        self.ws = null;
    };
    this.ws.onerror = function () {
        console.log("[WebSocket#onerror]\n");
    };
};

ChatClient.prototype.send = function(msg) {
    let cmd = {cmd: 'MSG'};
    cmd['name'] = this.name;
    cmd['msg'] = msg;
    this.ws.send(JSON.stringify(cmd));
    this.emit("sent", this.name, msg);
};
