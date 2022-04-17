const puppeteer = require('puppeteer');
const F2f = require('f2f');
const config = require('../config');

const path = require('path');
const { exec } = require('child_process');
const isPkg = typeof process.pkg !== 'undefined';

//If we are on windows and using pkg, use
//chromium from the build directory. otherwise use the
//default one (in node_modules)
let chromiumExecutablePath = undefined;
if (process.platform == 'win32') {
  chromiumExecutablePath = (isPkg ?
    puppeteer.executablePath().replace(
      /^.*?\\node_modules\\puppeteer\\\.local-chromium/,
      path.join(path.dirname(process.execPath), 'chromium')
    ) :
    puppeteer.executablePath()
  );
}

module.exports = class Crawler {
  constructor() {
    this._username = null;
    this._password = null;
    this._loginCaptcha = null;

    this.classPageLinks = [];
    this.classNames = [];
    this.allVideoLinks = [];
  }

  async init() {
    chromiumExecutablePath = await this.findChrome();

    this.browser = await puppeteer.launch({
      executablePath: chromiumExecutablePath,
    });
    this.page = await this.browser.newPage();
  }

  //Detect windows chrome (for chrome-less build)
  async findChrome() {
    if (process.platform != 'win32') { return undefined }
    return new Promise((resolve, reject) => {
      exec(
        "(Get-ItemProperty -LiteralPath 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe').'(default)'",
        { 'shell': 'powershell.exe' },
        (error, stdout) => {
          if (error) {
            resolve(undefined);
            return;
          }
          resolve(stdout.trim());
        }
      );
    });
  }

  async close() {
    await this.browser.close();
  }

  async openLoginPage() {
    return this.page.goto(config.crawling.loginPageUrl);
  }

  async saveLoginCaptcha() {
    await this.page.waitForSelector(config.crawling.captchaSelector);
    const captcha = await this.page.$(config.crawling.captchaSelector);
    return captcha.screenshot({ path: config.crawling.captchaSavePath });
  }

  async login() {
    await this.page.type(config.crawling.usernameFieldSelector, this._username);
    await this.page.type(config.crawling.passwordFieldSelector, this._password);
    await this.page.type(config.crawling.codeFieldSelector, this._loginCaptcha);
    await Promise.all([
      this.page.click(config.crawling.loginSubmitSelector),
      this.page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    if (this.page.url() == config.crawling.loginPageUrl) {
      throw new Error('Login failed! Check username, password and the entered captcha');
    }
  }

  async loadClassPages() {
    const f2f = new F2f();

    const sidenavContainers = await this.page.$$('.dropdown-container');
    for await (const container of sidenavContainers) {
      const link = await container.evaluate(containerElement => {
        return containerElement.lastElementChild.getAttribute('href');
      });
      this.classPageLinks.push(config.crawling.loginPageUrl + link);
    };

    const sidenavButtons = await this.page.$$('.dropdown-btn');
    for await (const button of sidenavButtons) {
      let farsiName = await button.evaluate(buttonElement => {
        return buttonElement.innerHTML.split('<')[0];
      });
      farsiName = farsiName.replace(/ك/gi, 'ک');
      farsiName = farsiName.replace(/ي/gi, 'ی');
      let finglishName = '';
      farsiName.split(' ').forEach( farsiNamePart => {
        finglishName += f2f.simplef2f(farsiNamePart);
        finglishName += ' ';
      });
      this.classNames.push(finglishName);
    }
  }

  async getClassVideoLinks() {
    let i = 0;
    for await (const classPageLink of this.classPageLinks) {
      await Promise.all([
        this.page.goto(classPageLink),
        this.page.waitForNavigation({ waitUntil: 'networkidle0' }),
      ]);
      
      const video = await this.page.evaluate(() => {
        const table = document.getElementById('table');
        if (!table || !table.rows || table.rows.length < 2) return null;

        const videoLinks = [];

        for (let i = 1; i < table.rows.length; i++) {
          const linkElement = table.rows.item(i).cells.item(3).firstElementChild;
          if (linkElement) {
            videoLinks.push(linkElement.getAttribute('href'));
          }
        }

        return { videoLinks };
      });

      if (video) {
        video.videoTitle = this.classNames[i];
        this.allVideoLinks.push(video);
      }
      i++;
    }
  }

  set password(newPassword) {
    this._password = newPassword;
  }

  set username(newUsername) {
    this._username = newUsername;
  }

  set loginCaptcha(newLoginCaptcha) {
    this._loginCaptcha = newLoginCaptcha;
  }
};
