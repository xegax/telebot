import mm = require('./mymap');
import cheerio = require('cheerio');
import request = require('request');

function cmp(lstA, lstB) {
    if (lstA.length != lstB.length)
        return false;
        
    for(var n = 0; n < lstA.length; n++) {
        if (lstB[n] !== lstA[n])
            return false;
    }
    
    return true;
}

export class Revision {
    id: string = '';    //D[0-9]?
    title: string = '';
    time: string = '';
    author: string = '';
    summary: string = '';
    status: string = '';
    reviewers: string[] = [];
    comments = new mm.MyMap<string, Comment>(); //comments.get(commentId) = Comment
    
    equals(other: Revision) {
        return this.id == other.id &&
            this.title == other.title &&
            this.time == other.time &&
            this.author == other.author &&
            this.summary == other.summary &&
            cmp(this.reviewers, other.reviewers);
    }
    
    copyTo(dst: Revision) {
        dst.id = this.id;
        dst.title = this.title;
        dst.time = this.time;
        dst.author = this.author;
        dst.summary = this.summary;
        dst.reviewers = this.reviewers.slice();
    }
}

export class Comment {
    id: string = '';
    text: string = '';
    author: string = '';
    time: string = '';
    
    equals(other: Comment) {
        return this.id == other.id &&
        this.text == other.text &&
        this.time == other.time &&
        this.author == other.author;
    }
}

class Config {
    static serverUrl = 'https://phabricator.megaputer.ru';
}

export class Phabricator {
    phsid: string;
    phusr: string;
    
    constructor(phusr, phsid) {
        this.phsid = phsid;
        this.phusr = phusr;
    }
    
    requestGET(url, callback) {
        var opts: any = {
          url: url,
          gzip: true,
          headers: {'Cookie': 'phsid=' + this.phsid + '; phusr=' + this.phusr + ';'}
        };

        return request.get(opts, function(err, req, content) {
            callback(content, req);
        });
    }
    
    parseRevisions(content) {
        var $ = cheerio.load( content );
        var revs = $('.phui-object-item');

        var revMap = new mm.MyMap<string, Revision>();
        for(var n = 0; n < revs.length; n++) {
            var rev = revs[n];
            
            var revData = new Revision();
            revData.id = $( '.phui-object-item-objname', rev ).text();
            revData.time = $( '.phui-object-item-col2 .phui-object-item-icon-label', rev ).text();
            revData.title = $( '.phui-object-item-name .phui-object-item-link', rev ).text();
            revData.author = $( '.phui-object-item-col2 .phui-link-person', rev ).text();
            
            var reviewersEl = $( 'li.phui-object-item-attribute a', rev );
            var reviewers = [];
            for(var i=0; i<reviewersEl.length; i++)
                revData.reviewers.push( $( reviewersEl[i] ).text() );
                
            revMap.set(revData.id, revData);
        }
        
        return revMap;
    }
    
    loadRevisions(callback: (revs: mm.MyMap<string, Revision>) => void) {
        var self = this;
        return this.requestGET(Config.serverUrl + '/differential/', function(content) {
            try {
                callback(self.parseRevisions(content));
            } catch(e) {
                callback(null);
            }
        });
    }
    
    parseRevision(content) {
        var $ = cheerio.load(content);
        /*var tr = $('form[action=#toc] .aphront-table-wrap tr');
        for (var n = 1; n < tr.length; n++) {
            var td = $('td', tr[n])[1];
            var id = $(td).text();
            if (!id)
                continue;
            diffIds.push(id);
        }*/
        
        var rev = new Revision();
        var commentMap = rev.comments;
        var items = $('.differential-primary-pane .phui-timeline-shell');
        for(var n = 0; n < items.length; n++) {
            var item = items[n];
            
            var comment = new Comment();
            var titleEl = <any>$('.phui-timeline-title', item);
            if (titleEl.length > 1)
                titleEl = titleEl[0];
            
            var author = <any>$('a.phui-link-person', titleEl);
            if (author.length > 1)
                author = author[0];
                
            comment.author = $(author).text();
            comment.time = $($('.phui-timeline-extra a', titleEl)[1]).text();
            comment.id = $('.phui-timeline-extra .phabricator-anchor-view', titleEl).attr('name');
            var text = $('.phui-timeline-core-content', item);
            
            if (!text.length) {
                var titleClone = $(titleEl).clone();
                $('.phui-timeline-extra', titleClone).html('');
                var titleText = <any>$(titleClone).text();
                if (!titleText.length)
                    continue;
                    
                comment.text = titleText;
                commentMap.set(comment.id, comment);
                continue;
            }
                
            var trs = $('.phabricator-inline-summary-table tr', text);
            if (!trs.length) {
                comment.text = text.text().trim();
                commentMap.set(comment.id, comment);
            } else {
                var commentText = '';
                var srcFile = '';
                for(var i = 0; i < trs.length; i++) {
                    var tr = trs[i];
                    var child = $(tr).children().first();
                    if (child.hasClass('inline-comment-summary-table-header')) {
                        srcFile = child.text();
                    } else if(child.hasClass('inline-line-number')) {
                        commentText += srcFile + ':' + child.text() + '\n  ' + child.next().text() + '\n';
                    }
                }
                comment.text = commentText.trim();
                commentMap.set(comment.id, comment);
            }
        }
        rev.id = $('.phabricator-nav-content .phui-crumbs-view .phabricator-last-crumb .phui-crumb-name').text();
        var boxes = $('.phabricator-nav-content .phui-object-box');
        var header = boxes[0];
        rev.title = $('.phui-header-tall .phui-header-header', header).text();
        rev.summary = $('.phui-property-list-section .phui-property-list-text-content .phabricator-remarkup', header).text();
        rev.status = $('.phui-header-status', header).text();
        rev.time = $('.phui-timeline-view .phui-timeline-shell .phui-timeline-extra a.phabricator-anchor-view').last().next().text();
        
        var keys = $('.phui-property-list-container .phui-property-list-properties .phui-property-list-key', header);
        keys.each(function(n, el){
            var key = $(el).text().trim();
            if (key == 'Author')
                rev.author = $('.phui-link-person', el.next).text();
            else if (key == 'Reviewers')
                $('.phui-link-person', el.next).each(function(idx, el) {
                    rev.reviewers.push($(el).text());
                });
        });
        return rev;
    }
    
    loadRevision(id: string, callback: (rev: Revision) => void ) {
        var self = this;
        return this.requestGET(Config.serverUrl + '/' + id, function(content) {
            try {
                callback(self.parseRevision(content));
            } catch(e) {
                callback(null);
            }
        });
    }
}

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';