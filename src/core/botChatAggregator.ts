import mm = require('./mymap');
import telebot = require('./telebot');
import cmddesc = require('./commandDesc');
import timer = require('./mytimer');
import cmn = require('./common');
import mfs = require('./FS');

export class TelegramApi {
  private bot: telebot.TeleBot;
  private chatId: number;
  
  constructor(bot: telebot.TeleBot, chatId: number) {
    this.bot = bot;
    this.chatId = chatId;
  }
  
  sendToGroup(msg: string) {
    this.bot.createMessage(msg, this.chatId).send();
  }
  
  sendToUser(msg: string, user: Telegram.Bot.User) {
    this.bot.createMessage(msg, user.id).send();
  }
}

export class GroupChat {
    fs: mfs.FS;
    telegram: TelegramApi;
    
    constructor() {
    }
    
    send(msg: string) {
        this.telegram && this.telegram.sendToGroup(msg);
    }
    
    sendTo(msg: string, user: Telegram.Bot.User) {
      this.telegram && this.telegram.sendToUser(msg, user);
    }
    
    setTelegramApi( telegram ) {
        this.telegram = telegram;
    }
    
    onCommand(msg: cmddesc.CommandDesc, user?: Telegram.Bot.User): string {
        return null;
    }
    
    save(): any {
        return {};
    }
    
    load(json: any) {    
    }
    
    destroy() {
    }
}

export class GroupChatContainer {
    chat: GroupChat;
    title: string;
    date: number;   //last message time
    first_name: string;
    user_name: string;
    user: Telegram.Bot.User;
    
    constructor(chat: GroupChat) {
      this.chat = chat;
    }
    
    save(): any {
      return {
        chat: this.chat.save(),
        title: this.title,
        date: this.date,
        user_name: this.user_name,
        first_name: this.first_name,
        user: this.user //может быть разным по-этому лучше не загружать
      };
    }
    
    load(json: any) {
      this.chat.load(json.chat);
      this.title = json.title;
      this.date = json.date;
      this.first_name = json.first_name;
      this.user_name = json.user_name;
    }
}

export class BotChatAggregator {
    map: mm.MyMap<number, GroupChatContainer> = new mm.MyMap<number, GroupChatContainer>();
    bot: telebot.TeleBot;
    createGroupChat: (jsonConfig: any) => GroupChat;
    name: string;
    fs: mfs.FS;
    
    constructor(name: string, bot: telebot.TeleBot, gcCreator: (jsonConfig: any) => GroupChat, fs: mfs.FS) {
        this.fs = fs;
        this.bot = bot;
        this.name = name;
        
        this.createGroupChat = gcCreator;
    }
    
    onMessage(msg: Telegram.Bot.Message) {
        if (msg.left_chat_participant)
            return this.onKickedFrom(msg);
        
        if (msg.new_chat_participant || msg.group_chat_created)
            return this.onInvitedTo(msg);
        
        if (!msg.text)
            return;
        
        var cmdList = cmddesc.CommandDesc.parseListSilent(msg.text);
        if (cmdList.length === 0)
            return;
        
        for (var n = 0; n < cmdList.length; n++) {
            var cmd = cmdList[n];
            if (cmd.getCmdName() === 'reboot') {
                this.bot.setListener(null);
                timer.clearAll();
                continue;
            }

            var chatId = msg.chat.id;
            var gc = this.makeAndGetChat(msg);
            gc.date = msg.date;

            if (cmd.getCmdName() === 'memusage') {
                var stat = this.bot.getStat();
                var text = [
                    'cur mem: ' + cmn.getFormatedBytes(stat.memUsage),
                    'max mem: ' + cmn.getFormatedBytes(stat.maxMemUsage)
                ].join('\n');
                this.bot.createMessage(text, chatId).send();
                continue;
            } else if (cmd.getCmdName() === 'stat') {
                var stat = this.bot.getStat();
                this.bot.createMessage(JSON.stringify(stat), chatId).send();
                continue;
            }
            try {
                var res = gc.chat.onCommand(cmd, msg.from);
                res && this.bot.createMessage(res, chatId).send();
                this.save(chatId, gc);
            } catch(e) {
                console.log(res);
            }
        }
    }
    
    getChatFileName(chatId: number) {
        return 'chat.' + chatId + '.json';
    }
    
    load() {
        this.fs.readdir().forEach((file) => {
            try {
                var fileArr = file.split('.');
                var chatId = parseInt(fileArr[1]);
                var type = fileArr[0].toLowerCase();
                
                if (type != 'chat')
                    return;
                
                console.log('loading', file);
                var json = this.fs.readJSON(file);
                
                var gcc = new GroupChatContainer(this.newGroupChat(chatId));
                gcc.load(json);
                this.bot.getMe( (user: Telegram.Bot.User) => {
                  gcc.user = user;
                  this.save(chatId, gcc);
                });
                
                this.map.set(chatId, gcc);
            } catch(e) {
                console.log(e);
            }
        });
    }
    
    private newGroupChat(chatId) {
        var gc = this.createGroupChat(this.fs.readJSON('bot.json'));
        gc.setTelegramApi(new TelegramApi(this.bot, chatId));
        gc.fs = this.fs;
        return gc;
    }
    
    private save(chatId: number, gc: GroupChatContainer) {
        var data = JSON.stringify(gc.save());
        this.fs.writeJSON(this.getChatFileName(chatId), gc.save());
    }
    
    private makeAndGetChat(msg: Telegram.Bot.Message): GroupChatContainer {
      var chatId = msg.chat.id;
      var gcc: GroupChatContainer = this.map.get(chatId);
      if (gcc)
          return gcc;
      
      var gc = this.newGroupChat(chatId);
      
      gcc = new GroupChatContainer(gc);
      gcc.title = (<Telegram.Bot.GroupChat>msg.chat).title;
      gcc.first_name = (<Telegram.Bot.User>msg.chat).first_name;
      gcc.user_name = (<Telegram.Bot.User>msg.chat).username;
      this.map.set(chatId, gcc);
      this.bot.getMe((user: Telegram.Bot.User) => {
        gcc.user = user;
        this.save(chatId, gcc);
      });
      
      return gcc;
    }
    
    private getSenderFunc(chatId: number) {
        var self = this;
        return function(msg) {
            return self.bot.createMessage(msg, chatId).send();
        };
    }
    
    private onKickedFrom(msg: Telegram.Bot.Message) {
        var gc = this.map.get(msg.chat.id);
        if (!gc)
          return;

        if (gc.user.id != msg.left_chat_participant.id)
          return console.log('user', msg.left_chat_participant, 'left from chat', msg.chat.id);
        
        gc.chat.destroy();
        this.map.remove(msg.chat.id);
        this.fs.unlinkSync(this.getChatFileName(msg.chat.id));
    }
    
    private onInvitedTo(msg: Telegram.Bot.Message) {
        var gc = this.makeAndGetChat(msg);
        this.save(msg.chat.id, gc);
    }
}