import {CommandDesc} from './core/commandDesc';
import {Runner} from './core/botChatRunner';
import {GroupChat} from './core/botchataggregator';
import {PhabricatorListener, PhabricatorWatcher} from './core/phabricatorwatcher';
import {Revision} from './core/phabricator';
import {MyMap, DiffKeys} from './core/mymap';

interface Listener {
  (message: string);
}

class ListenerCollection extends PhabricatorListener {
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
  
  onMergeRevisions(revs: MyMap<string, Revision>, diff: DiffKeys) {

    /*diff.appended.forEach(function(revId: string) {
        var rev = revs.get(revId);
        console.log('+', rev.title);
        self.onSend([
            '+' + self.getRevisionURL(revId),
            rev.title
        ].join('\n'));
    });*/
    
    diff.removed.forEach((revId: string) => {
      this.onSend('-' + this.getRevisionURL(revId));
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
  
  onMergeComments(rev: Revision, diff: DiffKeys) {
    diff.appended.forEach((commentId: string) => {
      var comment = rev.comments.get(commentId);
      console.log(comment);
      
      var msg = [this.getRevisionURL(rev.id, commentId)];
      if (rev.title)
          msg.push('title: ' + rev.title);
      if (comment.author)
          msg.push('author: ' + comment.author);
      msg.push(comment.text);
      
      this.onSend(msg.join('\n'));
    });
  }
  
  private onSend(msg: string) {
    this.listeners.forEach((listener) => {
      listener(msg);
    });
  }
}

var watcher: PhabricatorWatcher;
var listeners = new ListenerCollection();

class PhabricatorBot extends GroupChat {
  subscribed: boolean = false;
  listener: (msgs: string) => void;
  
  constructor(jsonConfig: any) {
    super();
    
    var self = this;
    this.listener = function(msg: string) {
      self.send(msg);
    }
    
    if (!watcher) {
      var phabricator = jsonConfig.phabricator;
      if (!phabricator)
        throw '"phabricator" not found in bot.json';
      
      var user = phabricator.user;
      if (!user)
        throw '"phabricator.user" not found in bot.json';
      
      var token = phabricator.token;
      if (!token)
        throw '"phabricator.token" not found in bot.json';
      
      watcher = new PhabricatorWatcher(user, token);
      watcher.setListener(listeners).start();
    }
  }
  
  destroy() {
    listeners.removeListener(this.listener);
  }
  
  onCommand(msg: CommandDesc): string {
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
  
  static create(jsonConfig: any): PhabricatorBot {
    return new PhabricatorBot(jsonConfig);
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

new Runner('MegaPhabot', PhabricatorBot.create).run();