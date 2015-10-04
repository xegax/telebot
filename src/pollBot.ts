import {Runner} from './core/botChatRunner';
import {GroupChat} from './core/botChatAggregator';
import {CommandDesc} from './core/commanddesc';
import {MyMap} from './core/mymap';

var BOT_NAME = 'MegaPollbot';

interface UserChoice {
  val: number;
  user: Telegram.Bot.User;
}

class PollData {
  private title: string;
  private users: MyMap<number, UserChoice> = new MyMap<number, UserChoice>();
  private options: string[] = [];
  private ownerUser: Telegram.Bot.User;
  
  constructor(title?: string, ownerUser?: Telegram.Bot.User) {
    this.title = title;    
    this.ownerUser = ownerUser;
  }
  
  print(full?: boolean) {
    var usersPoll = this.users.size();
    var select = this.options.map( () => { return {val: 0, users: []}; } );
    this.users.forEach((user, choice: UserChoice) => {
      select[choice.val].val++;
      select[choice.val].users.push(choice.user);
    });

    var lines = [ this.title || 'no title poll' ];
    lines = lines.concat(this.options.map( (s, i) => {
      var proc = select[i].val * 100 / usersPoll || 0;
      proc = Math.round(proc * 100) / 100;
      var res = '/' + (i + 1) + ' ' + s + ', ' + select[i].val + ' (' + proc + '%)';
      if (full)
        res += '\n' + select[i].users.map( (user: Telegram.Bot.User) => {
          return '- ' + user.first_name + ' ' + (user.last_name || user.username || '');
        }).join('\n');
      return res;
    }));
    return lines.join('\n');
  }
  
  getOwnerUserId() {
    if (this.ownerUser)
      return this.ownerUser.id;
  }
  
  setTitle(title: string) {
    this.title = title;
  }
  
  setSelect(optIdx: number, user: Telegram.Bot.User) {
    if (isNaN(optIdx) || optIdx === null || optIdx === undefined)
      throw 'Invalid option index is passed';
    if (optIdx <= 0 || optIdx > this.options.length)
      throw 'Option index out of range';
    this.users.set(user.id, { user: user, val: optIdx-1 });
    return true;
  }
  
  addOption(opt) {
    if (!opt)
      throw 'Option can not be empty';
    this.options.push(opt);
  }
  
  load(json: any) {
    this.title = json.title;
    this.users.load(json.users);
    this.options = json.options.slice();
    this.ownerUser = json.ownerUser;
  }
  
  save() {
    return {
      title: this.title,
      users: this.users.save(),
      options: this.options,
      ownerUser: this.ownerUser
    };
  }
}

class PollBot extends GroupChat {
  poll: PollData;

  constructor() {
    super();
  }

  onCommand(desc: CommandDesc, user?: Telegram.Bot.User) {
    var cmd = desc.getCmdName();
    try {
      if (cmd == 'newpoll') {
        return this.onNewPoll(desc, user);
      } else if (cmd == 'title') {
        return this.onTitle(desc);
      } else if (cmd == 'endpoll') {
        return this.onEndPoll(user);
      } else if (cmd == 'show') {
        return this.onShow(desc);
      } else if (cmd == 'showfull') {
        return this.onShowFull(desc);
      } else if (cmd == 'add') {
        return this.onAddOption(desc);
      } else if (cmd == 'help') {
        return this.onHelp();
      } else {
        this.tryToSelectSilent(desc, user);
      }
    } catch(e) {
      return e.toString();
    }
  }
  
  save(): any {
    return {
      poll: (this.poll)? this.poll.save() : null
    };
  }
  
  load(json: any) {
    this.poll = null;

    if (json.poll) {
      this.poll = this.poll || new PollData();
      this.poll.load(json.poll);
    }    
  }
  
  destroy() {
  }
  
  private getPoll() {
    if (!this.poll)
      throw 'You have not an active poll';
    return this.poll;
  }
  
  private onNewPoll(desc: CommandDesc, user: Telegram.Bot.User) {
    if (this.poll)
      throw 'You have an active poll, close it before';
    this.poll = new PollData(desc.getArgs(), user);
  }
  
  private onEndPoll(user: Telegram.Bot.User) {
    var poll = this.getPoll();
    var ownerId = poll.getOwnerUserId();
    if (ownerId !== undefined && ownerId !== user.id)
      throw 'Only owner can close this poll';
    
    var result = poll.print();
    this.poll = null;
    return result;
  }
  
  private onShow(desc: CommandDesc) {
    return this.getPoll().print(desc.getArgs() == 'full');
  }
  
  private onShowFull(desc: CommandDesc) {
    return this.getPoll().print(true);
  }
  
  private onAddOption(desc: CommandDesc) {
    var poll = this.getPoll();
    poll.addOption(desc.getArgs());
  }

  private onTitle(desc: CommandDesc) {
    var poll = this.getPoll();
    poll.setTitle(desc.getArgs());
  }

  private onHelp() {
    try {
      return this.fs.readFile('help.txt').toString();
    } catch(e) {
    }
  }

  private tryToSelectSilent(desc: CommandDesc, user: Telegram.Bot.User) {
    try {
      var num = parseInt(desc.getCmdName());
      return this.poll && this.poll.setSelect(num, user);
    } catch(e) {
      console.log(e);
      return false;
    }
  }

  static create(): GroupChat {
    return new PollBot();
  }
}

new Runner(BOT_NAME, PollBot.create).run();