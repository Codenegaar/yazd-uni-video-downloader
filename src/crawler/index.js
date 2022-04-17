const puppeteer = require('puppeteer');
const config = require('../config');

const path = require('path');
const isPkg = typeof process.pkg !== 'undefined';

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
    this.allVideoLinks = [];
  }

  async init() {
    this.browser = await puppeteer.launch({
      executablePath: chromiumExecutablePath,
    });
    this.page = await this.browser.newPage();
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
    const sidenavContainers = await this.page.$$('.dropdown-container');

    for await (const container of sidenavContainers) {
      let link = await container.evaluate(containerElement => {
        return containerElement.lastElementChild.getAttribute('href');
      });
      this.classPageLinks.push(config.crawling.loginPageUrl + link);
    };
  }

  async getClassVideoLinks() {
    for await (const classPageLink of this.classPageLinks) {
      await Promise.all([
        this.page.goto(classPageLink),
        this.page.waitForNavigation({ waitUntil: 'networkidle0' }),
      ]);
      
      const video = await this.page.evaluate(() => {
        const table = document.getElementById('table');
        if (!table) return;

        const videoLinks = [];

        for (let i = 1; i < table.rows.length; i++) {
          const linkElement = table.rows.item(i).cells.item(3).firstElementChild;
          if (linkElement) {
            videoLinks.push(linkElement.getAttribute('href'));
          }
        }

        const videoTitle = table.rows.item(1).cells.item(1).innerHTML.split('_')[0];
        return { videoLinks, videoTitle };
      });
      this.allVideoLinks.push(video);
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
