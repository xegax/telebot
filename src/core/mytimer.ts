import fs = require('fs');

var timers = [];
export function setInterval(callback, msec) {
    var timer = global.setInterval(callback, msec);
    timers.push({timer: timer, t: 'i'});
    return timer;
}

export function setTimeout(callback, msec) {
    var timer = global.setTimeout(callback, msec);
    timers.push({timer: timer, t: 't'});
    return timer;
}

function findIndex(timer) {
    for(var i = 0; i < timers.length; i++)
        if (timers[i].timer === timer)
            return i;
    return -1;
}

export function clearInterval(timer) {
    var idx = findIndex(timer);
    if (idx == -1)
        return;
    
    timers.splice(idx, 1);
    global.clearInterval(timer);
}

export function clearTimeout(timer) {
    var idx = findIndex(timer);
    if (idx == -1)
        return;
    
    timers.splice(idx, 1);
    global.clearTimeout(timer);
}

export function clearAll() {
    timers.forEach(function(t, idx) {
        if (t.t == 'i')
            global.clearInterval(t.timer);
        else if(t.t == 't')
            global.clearTimeout(t.timer);
    });
    timers.splice(0, timers.length);
}