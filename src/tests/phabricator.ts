import phb = require('../core/phabricator');
import mm = require('../core/mymap');
import fs = require('fs');

var api = new phb.Phabricator('kozlov', 'lvfwnlsve5zl2j2lnuvkzcjyetsp3ylfnmxtqybz');

function assert(rev, variable, value) {
    if (rev[variable] != value)
        console.log(variable, '!=', "'" + value + "'", '('+rev[variable]+')');
}

function doTest() {
    var rev = api.parseRevision(fs.readFileSync('data/D694.html').toString());
    assert(rev, 'status', 'Accepted');
    assert(rev, 'time', 'Wed, Jul 29, 7:16 PM');
    assert(rev, 'summary', 'Добавил конвертеры статических нод. Добавил механизм для вызова CheckedUpdate для Datagrid и в будущем для ОЛАП.');
    assert(rev, 'title', 'WRE:S2:E2:R3:17925 - User should be able to convert reports created in RE to recent format(convert static nodes & call checkedupdate for live components)');
    
    var comment = rev.comments.get('13390');
    assert(comment, 'text', 'trunk/ReportDesigner/Convert.cpp:307\n  У тебя же дальше newname и newdesc нигде не используются предлагаю заменить их на L""\nА первый булевый параметр в RD у нас всегда в false установлен, тут можно описания параметров посмотреть: https://bugtrack.megaputer.ru/show_bug.cgi?id=9356#c1\ntrunk/ReportDesigner/NodeConverters.cpp:22\n  Артёма на тебя нету, пробел забыл');
    
    comment = rev.comments.get('13395');
    assert(comment, 'text', 'исправления');
    
    comment = rev.comments.get('13397');
    assert(comment, 'text', 'kozlov accepted this revision.');
    
    comment = rev.comments.get('13399');
    assert(comment, 'text', 'This revision is now accepted and ready to land.');
    
    rev = api.parseRevision(fs.readFileSync('data/D782.html').toString());
    comment = rev.comments.get('15507');
    console.log(comment);
}

doTest();