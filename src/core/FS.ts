import fs = require('fs');

export class FS {
  cwd: string;
  
  constructor(cwd: string) {
    this.cwd = cwd;
    if (!fs.existsSync(cwd))
      fs.mkdirSync(this.cwd);
  }
  
  path(file: string) {
    return [this.cwd, file].join('/');
  }
  
  writeJSON(file: string, content: any) {
    fs.writeFileSync(this.path(file), JSON.stringify(content));
  }
  
  readJSON(file: string): any {
    return JSON.parse(fs.readFileSync(this.path(file)).toString());
  }
  
  readFile(file: string) {
    return fs.readFileSync(this.path(file));
  }
  
  readdir() {
    return fs.readdirSync(this.cwd);
  }
  
  unlinkSync(file: string) {
    fs.unlinkSync(this.path(file));
  }
};