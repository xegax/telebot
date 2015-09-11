import parser = require('./parser');

export class CommandDesc {
    private cmdName: string;
    private botName: string;
    private args: string;
    
    constructor(cmdName, botName, args) {
        this.cmdName = cmdName;
        this.botName = botName;
        this.args = args;
    }
    
    getCmdName() {
        return this.cmdName;
    }
    
    getBotName() {
        return this.botName;
    }
    
    getArgs() {
        return this.args;
    }
    
    static parse(rawText: string): CommandDesc {
        var cmdName = '', botName = null, args = '';
        
        var p = new parser.Parser(rawText);
        if (p.expect('/')) {
            cmdName = p.parseName();
            if (p.expect('@'))
                botName = p.parseName();
            args = p.getRest().trim();
        } else if (p.expect('@')) {
            botName = p.parseName();
            if (p.expect('/'))
                cmdName = p.parseName();
            else
                throw 'expected "/cmd"';
            args = p.getRest().trim();
        } else
            throw 'expected "/cmd@bot" or "/cmd" or "@bot /cmd"';

        return new CommandDesc(cmdName, botName, args);
    }
    
    static parseSilent(rawText: string): CommandDesc {
        try {
            return CommandDesc.parse(rawText);
        } catch(e) {
            return null;
        }
    }
    
    static parseListSilent(rawText: string): CommandDesc[] {
        var lst = [];
        var lines = rawText.split('\n');
        for (var l = 0; l < lines.length; l++) {
            var cmd = CommandDesc.parseSilent(lines[l]);
            if (cmd)
                lst.push(cmd);
            else
                lst.push(new CommandDesc(null, null, lines[l]));
        }
        return lst;
    }
}