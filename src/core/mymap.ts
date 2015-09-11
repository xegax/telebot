export class DiffKeys {
    appended: any[] = [];
    updated: any[] = [];
    removed: any[] = [];
}

export class MyMap<K,V> {
    map: any = {};
    
    put(key: any, val: V) {
        this.map[key] = val;
    }
    
    remove(key: any) {
        delete this.map[key];
    }
    
    has(key: any) {
        return this.map[key] !== undefined;
    }
    
    get(key: any): V {
        return this.map[key];
    }
    
    set(key: any, val: V) {
        this.map[key] = val;
    }
    
    size() {
        var n = 0;
        for(var key in this.map)
            n++;
        return n;
    }
    
    forEach(callback: (key: K, val: V) => void ) {
        for(var key in this.map)
            callback(key, this.map[key]);
    }
    
    clone(): MyMap<K, V> {
        var map = new MyMap<K, V>();
        this.forEach(function(key, val) {
            map.set(key, val);
        });
        return map;
    }
    
    save(): any {
        var obj: any = {};
        for(var key in this.map)
            obj[key] = this.map[key];
        return obj;
    }
    
    load(keyVals: any) {
        var map = {};
        for(var key in keyVals)
            map[key] = keyVals[key];
        this.map = map;
    }
    
    merge(otherMap): DiffKeys {
        var diff = new DiffKeys();
        
        var self = this;
        otherMap.forEach(function(key, val) {
            var thisVal = self.get(key);
            if (thisVal === undefined) {
                diff.appended.push(key);
                self.set(key, val);
            }
            else if (!MyMap.cmp(thisVal,val)) {
                diff.updated.push(key);
                if (!MyMap.copyFromTo(val, thisVal))
                    self.set(key, val);
            }
        });
        
        this.forEach(function(key, val) {
            var otherVal = otherMap.get(key);
            if (otherVal === undefined) {
                diff.removed.push(key);
                self.remove(key);
            }
        });
        
        return diff;
    }
    
    private static cmp(itemA, itemB): boolean {
        if (itemA.equals)
            return itemA.equals(itemB);
        return itemA === itemB;
    }
    
    private static copyFromTo(src, dst) {
        if (!(<any>src).copyTo)
            return false;
            
        (<any>src).copyTo(dst);
        return true;
    }
}