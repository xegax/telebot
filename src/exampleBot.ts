import {Runner} from './core/botChatRunner';
import {GroupChat} from './core/botChatAggregator';
import {CommandDesc} from './core/commanddesc';

class ExampleBot extends GroupChat {
  private title: string;
  
  constructor() {
    super();
  }
  
  onCommand(desc: CommandDesc, from: Telegram.Bot.User) {
    var cmd = desc.getCmdName();
    var args = desc.getArgs();
    
    if (cmd == 'title') {
      if (args == '')
        return 'title is [' + this.title + ']';
      else {
        this.title = args;
        return 'now title equals to [' + args + ']';
      }
    } else 
      return 'your command is [' + cmd + '] and args is [' + desc.getArgs() + ']';
  }
  
  save(): any {
    return {
      title: this.title
    };
  }
  
  load(json: any) {
    this.title = json.title;
  }
  
  destroy() {
  }
  
  static create(): GroupChat {
      return new ExampleBot();
  }
  
  static BotName() {
    return 'ExampleMegaBot';
  }
}

new Runner(ExampleBot.BotName(), ExampleBot.create).run();