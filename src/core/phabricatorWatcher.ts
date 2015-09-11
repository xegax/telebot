import phb = require('./phabricator');
import mm = require('./mymap');
import timer = require('./mytimer');

export class PhabricatorListener {
    requestCounter: number = 0;
    lastRevDiff: mm.DiffKeys;
    
    mergeRevisions(revs: mm.MyMap<string, phb.Revision>, diff: mm.DiffKeys) {
        this.lastRevDiff = diff;
        try {
            if (this.notifyMerge())
                this.onMergeRevisions(revs, diff);
        } catch(e) {
            this.onError(e);
        }
    }
    
    mergeComments(rev: phb.Revision, diff: mm.DiffKeys) {
        try {
            if (this.notifyMerge())
                this.onMergeComments(rev, diff);
        } catch(e) {
            this.onError(e);
        }
    }
    
    requestStarted() {
        try {
            this.onRequestStarted();
        } catch(e) {
            this.onError(e);
        }
    }
    
    requestFinished() {
        try {
            this.onRequestFinished();
        } catch(e) {
            this.onError(e);
        }
    }
    
    notifyMerge() {
        return this.requestCounter > 0;
    }
    
    onMergeRevisions(revs: mm.MyMap<string, phb.Revision>, diff: mm.DiffKeys) {
        console.log('onMergeRevisions', this.requestCounter, diff);
    }
    
    onMergeComments(rev: phb.Revision, diff: mm.DiffKeys) {
        console.log('onMergeComments', this.requestCounter, diff);
    }
    
    onRequestStarted() {
        console.log('wait request, N=', this.requestCounter, ',', Date());
    }
    
    onRequestFinished() {
        console.log('appended', this.lastRevDiff.appended.length, 'revisions');
        console.log('removed', this.lastRevDiff.removed.length, 'revisions');
        console.log('updated', this.lastRevDiff.updated.length, 'revisions');
        console.log();
    }
    
    onError(e) {
        console.log((<any>new Error(e)).stack);
    }
}

export class PhabricatorWatcher {
    private api = null;
    private listener: PhabricatorListener = new PhabricatorListener();
    private timer;
    private delayMs = 5000;
    private revisions = new mm.MyMap<string, phb.Revision>();
    private requestCounter: number = 0;
    private run: boolean;
    
    constructor(user?, token?) {
        this.api = new phb.Phabricator(user || 'kozlov', token || 'lvfwnlsve5zl2j2lnuvkzcjyetsp3ylfnmxtqybz');
    }

    setListener(listener: PhabricatorListener) {
        this.listener = listener;
        return this;
    }
    
    start() {
        if (this.timer)
            return this;
        
        this.run = true;
        this.delayedRequest(0);
        return this;
    }
    
    stop() {
        if (this.timer)
            timer.clearTimeout(this.timer);
        this.timer = null;
        this.run = false;
    }
    
    setDelay(delayMs) {
        this.delayMs = delayMs;
        return this;
    }
    
    private delayedRequest(delayMs) {
        var self = this;
        this.timer = timer.setTimeout(function() {
            try {
                self.timer = null;
                self.listener && self.listener.requestStarted();
                self.loadRevisions(function() {
                    self.listener && self.listener.requestFinished();
                    
                    self.requestCounter++;
                    self.listener && (self.listener.requestCounter = self.requestCounter);
                    
                    self.run && self.delayedRequest(self.delayMs);
                });
            } catch(e) {
                self.onError(e);
            }
        }, delayMs);
    }
    
    private onError(e) {
        console.log((<any>new Error(e)).stack);
    }
    
    private loadRevisions(callback?) {
        var self = this;
        this.api.loadRevisions(function(map) {
            try {
                self.mergeRevisions(self.revisions.merge(map), callback);
            } catch(e) {
                self.onError(e);
                callback && callback();
            }
        });
    }
    
    private mergeComments(rev, diff) {
        this.listener && this.listener.mergeComments(rev, diff);
    }

    private loadComments(rev, callback?) {
        var self = this;
        this.api.loadRevision(rev.id, function(revObj) {
            try {
                self.mergeComments(revObj, rev.comments.merge(revObj.comments));
            } catch(e) {
                self.onError(e);
            }
            callback && callback();
        });
    }
    
    private mergeRevisions(diff, callback) {
        var revs = [];
        var self = this;
        diff.appended.forEach(function(revId) {
            var rev = self.revisions.get(revId);
            revs.push(rev);
        });
        
        diff.updated.forEach(function(revId) {
            var rev = self.revisions.get(revId);
            revs.push(rev);
        });
        
        diff.removed.forEach(function(revId) {
        });
        
        this.listener && this.listener.mergeRevisions(this.revisions, diff);
        this.loadRevisionComments(revs, callback);
    }
    
    private loadRevisionComments(revs, callback) {
        if (revs.length === 0)
            return callback && callback();
            
        var rev = revs.splice(0, 1);
        var self = this;
        this.loadComments(rev[0], function() {
            self.loadRevisionComments(revs, callback);
        });
    }
}