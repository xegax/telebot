import telebot = require('./core/telebot');
import cmddesc = require('./core/commandDesc');
import botRunner = require('./core/botChatRunner');
import botAgg = require('./core/botchataggregator');
import tm = require('./core/mytimer');
import phbw = require('./core/phabricatorwatcher');
import phb = require('./core/phabricator');
import mm = require('./core/mymap');

interface Listener {
    (message: string);
}

class ListenerCollection extends phbw.PhabricatorListener {
    listeners: Listener[] = [];
    
    addListener(listener: Listener) {
        var idx = this.listeners.indexOf(listener);
        if (idx != -1)
            return false;
        this.listeners.push(listener);
        return true;
    }
    
    removeListener(listener: Listener) {
        var idx = this.listeners.indexOf(listener);
        if (idx == -1)
            return false;
        this.listeners.splice(idx, 1);
        return true;
    }
       
    notifyMerge() {
        return this.requestCounter > 0;
    }
    
    onMergeRevisions(revs: mm.MyMap<string, phb.Revision>, diff: mm.DiffKeys) {
        var self = this;
        /*diff.appended.forEach(function(revId: string) {
            var rev = revs.get(revId);
            console.log('+', rev.title);
            self.onSend([
                '+' + self.getRevisionURL(revId),
                rev.title
            ].join('\n'));
        });*/
        
        diff.removed.forEach(function(revId: string) {
            self.onSend('-' + self.getRevisionURL(revId));
        });
    }
    
    onRequestStarted() {
        if (this.requestCounter == 1)
            console.log('initial revisions loaded');
    }
    
    onRequestFinished() {
    }
    
    getRevisionURL(revId, commentId?) {
        var url = 'https://phabricator.megaputer.ru/' + revId;
        if (commentId)
            url += '#' + commentId;
        return url;
    }
    
    onMergeComments(rev: phb.Revision, diff: mm.DiffKeys) {
        var self = this;
        diff.appended.forEach(function(commentId: string) {
            var comment = rev.comments.get(commentId);
            console.log(comment);
            
            var msg = [self.getRevisionURL(rev.id, commentId)];
            if (rev.title)
                msg.push('title: ' + rev.title);
            if (comment.author)
                msg.push('author: ' + comment.author);
            msg.push(comment.text);
            
            self.onSend(msg.join('\n'));
        });
    }
    
    private onSend(msg: string) {
        this.listeners.forEach(function(listener) {
            listener(msg);
        });
    }
}

var listeners = new ListenerCollection();
var watcher = new phbw.PhabricatorWatcher();
watcher.setListener(listeners).start();

class TestBotChat extends botAgg.GroupChat {
    subscribed: boolean = false;
    listener: (msgs: string) => void;
    
    constructor() {
        super();
        
        var self = this;
        this.listener = function(msg: string) {
            self.send(msg);
        }
    }
    
    destroy() {
        listeners.removeListener(this.listener);
    }
    
    onCommand(msg: cmddesc.CommandDesc): string {
        var cmd = msg.getCmdName();
        if (cmd == 'subscribe' && listeners.addListener(this.listener)) {
            this.subscribed = true;
            return 'you are subscribed';
        }
        if (cmd == 'unsubscribe' && listeners.removeListener(this.listener)) {
            this.subscribed = false;
            return 'you are unsubscribed';
        }
        return '';
    }
    
    static create(): TestBotChat {
        return new TestBotChat();
    }
    
    save(): any {
        return {
            subscribed: this.subscribed
        };
    }
    
    load(obj: any) {
        this.subscribed = obj.subscribed;
        
        if (this.subscribed)
            listeners.addListener(this.listener);
        else
            listeners.removeListener(this.listener);
    }
}
new botRunner.Runner('MegaPhabot', TestBotChat.create).run();