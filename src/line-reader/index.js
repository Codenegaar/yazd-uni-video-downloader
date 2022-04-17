const readline = require('readline');

module.exports = class LineReader {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async input(question) {
    return new Promise((resolve, _reject) => {
      this.rl.question(question, answer => {
        resolve(answer);
      });
    });
  }
};
