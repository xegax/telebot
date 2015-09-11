import runner = require('./core/botChatRunner');
import chatAggr = require('./core/botChatAggregator');
import cmddesc = require('./core/commanddesc');
import telebot = require('./core/telebot');

class ExampleBot extends chatAggr.GroupChat {
    private title: string;
    
    constructor() {
        super();
    }
    
    onCommand(desc: cmddesc.CommandDesc, from: Telegram.Bot.User) {
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
    
    static create(): chatAggr.GroupChat {
        return new ExampleBot();
    }
    
    static BotName() {
      return 'ExampleMegaBot';
    }
}

new runner.Runner(ExampleBot.BotName(), ExampleBot.create).run();