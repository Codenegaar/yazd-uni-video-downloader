const Crawler = require('./crawler');
const LineReader = require('./line-reader');
const config = require('./config');
const Downloader = require('./downloader');

const fs = require('fs');
const { exec } = require('child_process');

async function start() {
  try {
    const crawler = new Crawler();
    await crawler.init();
    const lineReader = new LineReader();

    const credentials = await getCredentials(lineReader);
    crawler.username = credentials.username;
    crawler.password = credentials.password;

    await crawler.openLoginPage();
    await crawler.saveLoginCaptcha();

    if (process.platform == 'win32') {
      exec(`${config.crawling.captchaSavePath}`);
    }
    const captcha = await lineReader.input(`Enter the captcha code found at ${config.crawling.captchaSavePath}: `);
    crawler.loginCaptcha = captcha;
    console.log('Logging you in...');
    await crawler.login();

    console.log('Receiving video links...');
    await crawler.loadClassPages();
    await crawler.getClassVideoLinks();
    await crawler.close();
    console.log('Received video links');

    fs.writeFileSync(config.linkSavePath, JSON.stringify(crawler.allVideoLinks, null, 4));
    console.log(`All links written to ${config.linkSavePath}`);

    const dl = await lineReader.input('Do you want to continue downloading videos? [Y/n]: ');
    if (dl && dl.toUpperCase() != 'Y') {
      process.exit(0);
    }

    let videosToDownload = [];
    for await (const classLinks of crawler.allVideoLinks) {
      const dl = await lineReader.input(`Download ${classLinks.videoTitle}? [Y/n]: `);
      if (!dl || dl.toUpperCase() == 'Y') {
        videosToDownload.push(classLinks);
      }
    }

    for await (const classLinks of videosToDownload) {
      const downloader = new Downloader(classLinks.videoTitle, classLinks.videoLinks);
      await downloader.downloadAll();
    }
  } catch(error) {
    console.error(error.message);
    process.exit(1);
  }
}

async function getCredentials(lineReader) {
  const username = await lineReader.input('Enter your username: ');
  const password = await lineReader.input('Enter your password: ');
  return { username, password };
}

start();
