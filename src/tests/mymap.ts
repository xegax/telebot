import mm = require('../core/mymap');

class Item {
    text: string;
    user: string;
    
    constructor(text, user) {
        this.text = text;
        this.user = user;
    }
    
    equals(other: Item): boolean {
        return other.text == this.text && other.user == this.user;
    }
    
    copyTo(dst: Item) {
        dst.text = this.text;
        dst.user = this.user;
    }
}

function assert(ok, msg) {
    if (!ok)
        console.log(msg);
}

function cmp(lstA, lstB) {
    if (lstA.length != lstB.length)
        return false;
        
    for(var n = 0; n < lstA.length; n++) {
        if (lstB[n] !== lstA[n])
            return false;
    }
    
    return true;
}

function doMergeTest() {
    var mainMap = new mm.MyMap<number, Item>();
    
    var diffMap = new mm.MyMap<number, Item>();
    diffMap.set(111, new Item('тема номер 1', 'xega'));
    diffMap.set(123, new Item('машинки', 'user'));
    
    var diff = mainMap.merge(diffMap);
    assert(cmp(diff.appended, ['111', '123']) && diff.updated.length == 0 && diff.removed.length == 0, diff);
    
    
    diffMap.set(130, new Item('соме дата', 'пользователь'));
    diffMap.remove(111);
    diffMap.set(123, new Item('машинки', 'узер'));
    
    diff = mainMap.merge(diffMap);
    assert(cmp(diff.appended, ['130']) && cmp(diff.updated, ['123']) && cmp(diff.removed, ['111']), diff);
    
    var update1, update5;
    diffMap.set(131,  new Item('соме дата', 'пользователь'));
    diffMap.set(5, update5 = new Item('five', 'пользователь5'));
    diffMap.set(1, update1 = new Item('one', 'ван'));
    diffMap.remove(123);
    diffMap.remove(130);
    
    diff = mainMap.merge(diffMap);
    assert(cmp(diff.appended, ['1', '5', '131']) && cmp(diff.updated, []) && cmp(diff.removed, ['123', '130']), diff);
    
    diffMap.set(131, new Item('соме дата', 'пользователь'));
    diffMap.set(5, new Item('five1', 'пользователь5'));
    diffMap.set(1, new Item('one1', 'ван'));

    diff = mainMap.merge(diffMap);
    assert(cmp(diff.appended, []) && cmp(diff.updated, ['1', '5']) && cmp(diff.removed, []), diff);
    
    //check working copyTo
    assert(mainMap.get(1)==update1 && mainMap.get(5)==update5, 'must be mainMap.get(1)==update1 && mainMap.get(5)==update5');
}

doMergeTest();