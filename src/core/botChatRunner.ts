import telebot = require('./telebot');
import botAgg = require('./botChatAggregator');
import mfs = require('./fs');

export class Runner {
    private bot: telebot.TeleBot;
    private chatAggr: botAgg.BotChatAggregator;
    private name: string;
    private fs: mfs.FS;
    
    constructor(name: string, groupCreator: (jsonConfig: any) => botAgg.GroupChat, botToken?: string) {
        this.fs = new mfs.FS(['data', name].join('/'));
        this.name = name;
        
        if (!botToken)
          try {
            var cfg = this.fs.readJSON('bot.json');
            if (cfg.token == undefined)
              throw '"token" can not be undefined in "' + this.fs.path('bot.json') + '"';
            botToken = cfg.token;
          } catch(e) {
            console.log(e);
            process.exit(1);
          }
        
        this.bot = new telebot.TeleBot(botToken, this.fs);
        this.chatAggr = new botAgg.BotChatAggregator(name, this.bot, groupCreator, this.fs);
        this.loadSilent();
    }
    
    run() {
        this.bot.setListener((updates: Telegram.Bot.Update[]) => {
            this.saveSilent();
            
            for (var n = 0; n < updates.length; n++) {
                var incoming = updates[n].message;        
                this.chatAggr.onMessage(incoming);
            }
        });
    }
    
    saveSilent() {
        try {
            var state = this.bot.save();
            this.fs.writeJSON(this.getStateFileName(), state);
        } catch(e) {
          console.log(e);
        }
    }
    
    loadSilent() {
        try {
            var state = this.fs.readJSON(this.getStateFileName());
            this.bot.load(state);
            this.chatAggr.load();
        } catch(e) {
            console.log(e);
        }
    }
    
    private getStateFileName() {
        return 'state.json';
    }
}