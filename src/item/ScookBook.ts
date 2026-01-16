import { ScrapeError } from '../error/ScrapeError';
import { delay } from '../util/promise';
import { Book } from './Book';
import { defDownloadOptions, DownloadOptions } from './download-options';
import { getPdfOptions } from './get-pdf-options';

export class ScookBook extends Book {
  async download(outDir: string, _options?: DownloadOptions) {
    const dir = await this.mkSubDir(outDir);
    const options = defDownloadOptions(_options);

    // Get book frame url
    let bookFrameUrl: string;

    const userPage = await this.shelf.browser.newPage();
    try {
      await userPage.goto(this.url, {
        waitUntil: 'load',
        timeout: this.shelf.options.timeout,
      });

      bookFrameUrl = await userPage.$eval(
        '.book-frame',
        (bookFrame) => (bookFrame as HTMLIFrameElement).src
      );
    } finally {
      await userPage.close();
    }

    // Get page count and navigate through pages sequentially
    let pageCount: number;

    const page = await this.shelf.browser.newPage();
    try {
      await page.goto(bookFrameUrl, {
        waitUntil: 'load',
        timeout: this.shelf.options.timeout,
      });

      while (true) {
        try {
          pageCount = parseInt(
            await page.$eval(
              '#total-pages',
              (totalPages) => (totalPages as HTMLSpanElement).innerText
            )
          );
        } catch (e) {
          await delay(1000);
          continue;
        }
        if (isNaN(pageCount)) continue;
        break;
      }

      // Page download - navigate sequentially through pages
      let downloadedPages = 0;
      const getProgress = () => ({
        item: this,
        percentage: downloadedPages / pageCount,
        downloadedPages,
        pageCount,
      });
      options.onStart(getProgress());

      // Download each page sequentially
      for (let pageNo = 1; pageNo <= pageCount; pageNo++) {
        // Wait for the image to load
        await page.waitForSelector('.image-div > img', {
          timeout: this.shelf.options.timeout,
        });

        // Save current page as pdf
        const pdfFile = this.getPdfPath(dir, pageNo);

        await page.pdf({
          ...(await getPdfOptions(page, options)),
          path: pdfFile,
        });

        downloadedPages++;
        options.onProgress(getProgress());

        // Navigate to next page if not the last page
        if (pageNo < pageCount) {
          const goNextButton = await page.$('.go-next');
          if (!goNextButton) {
            throw new ScrapeError(
              `Could not locate "go-next" button on page ${pageNo}.`
            );
          }

          await goNextButton.click();

          // Wait for navigation to complete
          await delay(1000);
        }
      }
    } finally {
      await page.close();
    }

    // Merge pdf pages
    options.mergePdfs && (await this.mergePdfPages(dir, pageCount));
  }
}
