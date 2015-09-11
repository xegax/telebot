import parser = require('../core/parser');

function doTest() {
    var testData = [{
            srcText: '  /cmdName   command argument 1',
            cmd: 'cmdName',
            bot: undefined,
            args: '   command argument 1'
        }, {
            srcText: ' /cmdName@BotName    command argument 2',
            cmd: 'cmdName',
            bot: 'BotName',
            args: '    command argument 2'
        }, {
            srcText: ' @BotName   /cmdName   command argument 3',
            cmd: 'cmdName',
            bot: 'BotName',
            args: '   command argument 3'
        }
    ];
    
    for (var n = 0; n < testData.length; n++) {
        var cmdName = "", botName = "", args = "";
        var testItem = testData[n];
        
        var p = new parser.Parser(testItem.srcText);
        if (p.expect('/')) {
            cmdName = p.parseName();
            if (p.expect('@'))
                botName = p.parseName();
            args = p.getRest();
        } else if (p.expect('@')) {
            botName = p.parseName();
            if (p.expect('/'))
                cmdName = p.parseName();
            args = p.getRest();
        }
        
        var invalid = 0;
        if (testItem.cmd != cmdName)
            invalid++;

        if(testItem.bot && testItem.bot != botName)
            invalid++;
        
        if(testItem.args != args)
            invalid++;
        
        if(invalid)
            console.log("fail,", testItem);
        else
            console.log("ok,", testItem);
    }
}

doTest();