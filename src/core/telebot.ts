import request = require('request');
import mfs = require('./FS');
import child = require('child_process');
import timer = require('./mytimer');

var BOT_API_GET_UPDATES = 'getUpdates';
var BOT_API_SEND_MESSAGE = 'sendMessage';
var BOT_API_SEND_PHOTO = 'sendPhoto';
var BOT_API_GET_ME = 'getMe';

var HTTP_GET = 'GET';
var HTTP_POST = 'POST';

export class Config {
    static serverURL: string;
    static updateTimeout: number = 30;
}

export interface Callback {
    (ok: boolean, msg: Telegram.Result<Telegram.Bot.Message>);
}

export class Params {
    callbacks_: { [events: string] : Callback } = {};
    event_: string;
    method_: string = HTTP_GET;
    token_: string;
           
    on(event: string, callback: Callback) {
        this.callbacks_[event] = callback;
        return this;
    }
    
    token(token: string): Params {
        this.token_ = token;
        return this;
    }
    
    event(event: string): Params {
        this.event_ = event;
        return this;
    }
    
    send() {
        Common.send(this);
    }
    
    get(): any {
        throw 'not implemented';
    }
}

export class SendMessageParams extends Params {
    obj_: Telegram.Bot.SendMessage = <Telegram.Bot.SendMessage>{};
    
    constructor() {
        super();
        this.method_ = HTTP_POST;
    }
    
    text(text: string): SendMessageParams {
        this.obj_.text = text;
        return this;
    }
    
    chat_id(id: number): SendMessageParams {
        this.obj_.chat_id = id;
        return this;
    }
    
    preview(enable: boolean): SendMessageParams {
        this.obj_.disable_web_page_preview = enable ? 0 : 1;
        return this;
    }
    
    get(): any {
        return this.obj_;
    }
}

class Common {
    static getServerURL(path): string {
        return (Config.serverURL || 'https://api.telegram.org')+ '/' + path;
    }

    static getCallURI(event: string, token: string, options?: any): string {
        var uri = Common.getServerURL('bot' + token + '/' + event);

        var params = '';
        if(options)
            for (var name in options) {
                var value = options[name];
                if (value === undefined)
                    continue;
                if (params)
                    params += '&';
                params += (name + '=' + value);
            }
        
        if (params)
            uri += '?'+ params;

        return uri;
    }

    static requestGET(
        uri: string,
        callback: (res: Telegram.Result<any>) => void) {
        
        return request.get(uri, function(err, resp, data) {
            try {
                console.log(data);
                callback && callback(JSON.parse(data));
            } catch(e) {
                console.log(e);
                callback({'ok': false, 'result': []});
            }
        });
    }

    static requestPOST(
        uri: string,
        callback: (res: Telegram.Result<any> | Telegram.Result2<any>) => void,
        params?: any) {
        return request.post({
            url: uri,
            form: params,
            }, function(err, resp, data) {
                try {
                    callback && callback(JSON.parse(data));
                } catch(e) {
                    console.log(e);
                    callback({'ok': false, 'result': []});
                }
            }
        );
    }
    
    static send(params: Params) {
        var url = Common.getCallURI(params.event_, params.token_);
        
        var callback = function(res) {
            var load = params.callbacks_['load'];
            load && load(res.ok === true, res);
        };
        
        if(params.method_ === HTTP_GET)
            Common.requestGET(url, callback);
        else if(params.method_ === HTTP_POST)
            Common.requestPOST(url, callback, params.get());
    }
}

export class Statistics {
    private lastUpdateRequestTime: number = 0;
    private lastUpdateResponseTime: number = 0;
    private totalUpdateRequest: number = 0;
    private totalUpdateResponse: number = 0;
    private maxMemUsage: number = 0;
    private memUsage: number = 0;
    
    onUpdateRequest() {
        this.totalUpdateRequest++;
        this.lastUpdateRequestTime = new Date().getTime();
        this.updateMemUsage();
    }
    
    onUpdateResponse() {
        this.totalUpdateResponse++;
        this.lastUpdateResponseTime = new Date().getTime();
        this.updateMemUsage();
    }
    
    updateMemUsage() {
        this.memUsage = process.memoryUsage().rss;
        this.maxMemUsage = Math.max(this.memUsage, this.maxMemUsage);
    }
    
    save() {
        return {
            lastUpdateRequestTime: this.lastUpdateRequestTime,
            lastUpdateResponseTime: this.lastUpdateResponseTime,
            totalUpdateRequest: this.totalUpdateRequest,
            totalUpdateResponse: this.totalUpdateResponse,
            maxMemUsage: this.maxMemUsage,
            memUsage: this.memUsage
        };
    }
}

export class TeleBot {
    private token: string;
    private nextUpdateIdx: number;
    private listener: (updates: Telegram.Bot.Update[]) => void;
    private stat: Statistics = new Statistics();
    private fs: mfs.FS;
    
    constructor(token: string, fs: mfs.FS) {
        this.token = token;
        this.fs = fs;
    }
    
    createMessage(text: string, chat_id: number): SendMessageParams {
        return <any>new SendMessageParams()
            .text(text)
            .chat_id(chat_id)
            .event(BOT_API_SEND_MESSAGE)
            .token(this.token);
    }
    
    createReplyMessage(text: string, incoming: Telegram.Bot.Message): SendMessageParams {
        return <any>this.createMessage( text, incoming.chat.id );
    }
    
    sendPhoto(params: Telegram.Bot.SendPhoto, callback?: (ok: boolean, res?: Telegram.Result<Telegram.Bot.Message> | Telegram.Result2<Telegram.Bot.Message>) => void) {
        var url = Common.getCallURI(BOT_API_SEND_PHOTO, this.token);
        Common.requestPOST(url, function(res: Telegram.Result<Telegram.Bot.Message> | Telegram.Result2<Telegram.Bot.Message>) {
            callback && callback(res.ok === true, res);
        }, params);
    }
    
    getMe(callback: (user: Telegram.Bot.User) => void) {
      var url = Common.getCallURI(BOT_API_GET_ME, this.token);
      Common.requestGET(url, (res) => {
        callback && callback(<any>res.result);
      });
    }
      
    save(): any {
        return {
            nextUpdateIdx: this.nextUpdateIdx
        };
    }
    
    load(json: any) {
        this.nextUpdateIdx = json.nextUpdateIdx;
    }
    
    setListener(callback) {
        var start = !this.listener && callback;
        this.listener = callback;
        
        if(start)
            this.waitUpdates(Config.updateTimeout);
    }
    
    getStat() {
        return this.stat.save();
    }
    
    private getUpdates(timeout?: number, callback?: (updates: Telegram.Bot.Update[]) => void) {
        var self = this;
        var uri = Common.getCallURI(BOT_API_GET_UPDATES, this.token, { timeout: timeout, offset: this.nextUpdateIdx });
        
        this.stat.onUpdateRequest();
        self.writeStat();
        
        var timerToEnd;
        var req = Common.requestGET(uri, function(res: Telegram.Result<Telegram.Bot.Update>) {
            try {
                timer.clearTimeout(timerToEnd);
            } catch(e) {
                console.log(e);
            }
            
            self.stat.onUpdateResponse();
            self.writeStat();
            
            var updates = res.result;
            
            if (updates.length) {
                self.nextUpdateIdx = updates[updates.length - 1].update_id + 1;
            }
            
            callback && callback(updates);
        });
        timerToEnd = timer.setTimeout(this.waitForUpdateResponse(req, callback), timeout * 1000 + 1000);
    }
    
    private waitForUpdateResponse(req, callback) {
        return function() {
            try {
                console.log('finish request');
                req.abort();
            } catch(e) {
                console.log(e);
            }
            callback && callback({ok: true, result:[]});
        }
    }

    private waitUpdates(timeout?: number) {
        if(!this.listener)
            return;
        
        var self = this;
        this.getUpdates( timeout, function(updates) {
            try {
                global.gc();
            } catch(e) {
            }
            try {
                self.listener && self.listener( updates );
                self.waitUpdates( timeout );
            } catch(e) {
                console.log(e);
            }
        });
    }
    
    private writeStat() {
        try {
            this.fs.writeJSON('statistics.json', this.stat.save());
        } catch(e) {
        }
    }
}