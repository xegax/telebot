var CHAR_CODE_0 = '0'.charCodeAt(0);
var CHAR_CODE_9 = '9'.charCodeAt(0);
var CHAR_CODE_a = 'a'.charCodeAt(0);
var CHAR_CODE_z = 'z'.charCodeAt(0);
var CHAR_CODE_A = 'A'.charCodeAt(0);
var CHAR_CODE_Z = 'Z'.charCodeAt(0);

export class Parser {
    private srcText: string;
    private pos: number = 0;
    private parseFrom: number = 0;
    
    constructor(srcText: string) {
        this.srcText = srcText;
    }
    
    expect(str: string): boolean {
        var src = this.srcText;
        var from = this.pos;
        
        for (; from < src.length; from++) {
            var chr = src[from];
            if (!Parser.isWhiteSpace(chr))
                break;
        }
        
        this.pos = from;
        if(src.substr(from, str.length) === str) {
            this.parseFrom = from + str.length;
            return true;
        }
        return false;
    }
    
    parseName(): string {
        var src = this.srcText;
        var from = this.parseFrom;
        
        for (var n = from; n < src.length; n++) {
            var chr = src[n];
            if(Parser.isNameChar(chr) || Parser.isNumeric(chr))
                continue;
            break;
        }
        
        this.pos = this.parseFrom = n;
        return src.substr(from, n-from);
    }
    
    getRest(): string {
        return this.srcText.substr(this.parseFrom);
    }
    
    static isWhiteSpace(c: string): boolean {
        return c === ' ' || c === '\t';
    }
    
    static isNumeric(c: string): boolean {
        var code = c.charCodeAt(0);
        return code >= CHAR_CODE_0 && code <= CHAR_CODE_9;
    }
    
    static isNameChar(c: string): boolean {
        var code = c.charCodeAt(0);
        return code >= CHAR_CODE_a && code <= CHAR_CODE_z || code >= CHAR_CODE_A && code <= CHAR_CODE_Z;
    }
};