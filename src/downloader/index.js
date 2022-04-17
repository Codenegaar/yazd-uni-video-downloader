const NFDownloader = require('nodejs-file-downloader');
const cliProgress = require('cli-progress');
const colors = require('ansi-colors');

module.exports = class Downloader {
  constructor(downloadPath, links) {
    this.downloadPath = downloadPath;
    this.links = links;
  }

  async downloadAll() {
    console.log(`Downloading to ${this.downloadPath}`);

    for await (const link of this.links) {
      const filename = link.split('\\').pop();
      console.log(`\tDownloading ${filename}`);

      const progressBar = new cliProgress.SingleBar({
        format: `\t` + colors.cyan('{bar}') + '| {percentage}%',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
      });
      progressBar.start(100, 0);

      const downloader = new NFDownloader({
        url: link,
        directory: this.downloadPath,
        onProgress: function (percentage) {
          progressBar.update(Math.ceil(percentage));
        },
      });

      try {
        await downloader.download();
        progressBar.stop();
      } catch(error) {
        console.error(`\n\tDownload failed, maybe the video is not published or deleted.`);
        progressBar.stop();
      }
    }
  }
};
