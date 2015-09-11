import cmdd = require('../core/commandDesc');

function doTest() {
    var testData = [{
            srcText: '  /help   command argument 1',
            cmds: [{
                cmd: 'help',
                bot: undefined,
                args: 'command argument 1'
            }]
        }, {
            srcText: '  /create  11 22 33',
            cmds: [{
                cmd: 'create',
                bot: undefined,
                args: '11 22 33'
            }]
        }, {
            srcText: '/1',
            cmds: [{
                cmd: '1',
                bot: undefined,
                args: ''
            }]
        }, {
            srcText: '  /help@bot1   command argument 1',
            cmds: [{
                cmd: 'help',
                bot: 'bot1',
                args: 'command argument 1'
            }]
        }, {
            srcText: '  /create@bot2  11 22 33',
            cmds: [{
                cmd: 'create',
                bot: 'bot2',
                args: '11 22 33'
            }]
        }, {
            srcText: '/1@bot3',
            cmds: [{
                cmd: '1',
                bot: 'bot3',
                args: ''
            }]
        }, {
            srcText: ' @bot1  /help   command argument 1',
            cmds: [{
                cmd: 'help',
                bot: 'bot1',
                args: 'command argument 1'
            }]
        }, {
            srcText: ' @bot2  /create  11 22 33',
            cmds: [{
                cmd: 'create',
                bot: 'bot2',
                args: '11 22 33'
            }]
        }, {
            srcText: ' @bot3 /1',
            cmds: [{
                cmd: '1',
                bot: 'bot3',
                args: ''
            }]
        }, {
            srcText: ' /poll title\n/1 opt1\n/2 opt2\n/3 opt3\n/show',
            cmds: [{
                cmd: 'poll',
                bot: undefined,
                args: 'title'
            }, {
                cmd: '1',
                bot: undefined,
                args: 'opt1'
            }, {
                cmd: '2',
                bot: undefined,
                args: 'opt2'
            }, {
                cmd: '3',
                bot: undefined,
                args: 'opt3'
            }, {
                cmd: 'show',
                bot: undefined,
                args: ''
            }]
        }, {
            srcText: ' /poll title\nsome raw text\n/2 opt2',
            cmds: [{
                cmd: 'poll',
                bot: undefined,
                args: 'title'
            }, {
                cmd: null,
                bot: null,
                args: 'some raw text'
            }, {
                cmd: '2',
                bot: undefined,
                args: 'opt2'
            }]
        }
    ];
    
    var okCounter = 0;
    for (var n = 0; n < testData.length; n++) {
        var testItem = testData[n];
        var cmdDescs = cmdd.CommandDesc.parseListSilent(testItem.srcText);
        
        try {
            if(testItem.cmds.length != cmdDescs.length)
                throw [cmdDescs.length, '!=', testItem.cmds.length].join(' ');
            
            for(var i = 0; i < cmdDescs.length; i++) {
                var cmdDesc = cmdDescs[i];
                if (cmdDesc.getCmdName() != testItem.cmds[i].cmd)
                    throw [cmdDesc.getCmdName(), '!=', testItem.cmds[i].cmd].join(' ');
                if (cmdDesc.getBotName() != testItem.cmds[i].bot)
                    throw [cmdDesc.getBotName(), '!=', testItem.cmds[i].bot].join(' ');
                if (cmdDesc.getArgs() != testItem.cmds[i].args)
                    throw [cmdDesc.getArgs(), '!=', testItem.cmds[i].args].join(' ');
            }
            
            console.log('ok,', testItem);
            okCounter++;
        } catch(e) {
            console.error('fail,', e);
        }
    }
    console.log((okCounter === testData.length)?'success,':'fail,', okCounter, 'of', testData.length);  
}

doTest();
