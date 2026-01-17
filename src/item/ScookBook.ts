import { ScrapeError } from '../error/ScrapeError';
import { delay } from '../util/promise';
import { Book } from './Book';
import { defDownloadOptions, DownloadOptions } from './download-options';
import { getPdfOptions } from './get-pdf-options';

export class ScookBook extends Book {
  // Delay between page navigations to ensure content loads properly
  private static readonly PAGE_NAVIGATION_DELAY_MS = 1000;

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
    let pageXUrl: string;

    const page = await this.shelf.browser.newPage();
    try {
      await page.goto(bookFrameUrl, {
        waitUntil: 'domcontentloaded',
        timeout: this.shelf.options.timeout,
      });

      // Go to the first page
     console.log('Frame: ', bookFrameUrl);
    // Wait for the toolbar to be fully loaded before interacting
      await page.waitForSelector('.toolbar', {
        timeout: this.shelf.options.timeout,
      });

      // Click "go-first" to ensure we start at page 1
      const goFirstButton = await page.$('.go-first');
      if (goFirstButton) {
        await goFirstButton.click();
        await delay(ScookBook.PAGE_NAVIGATION_DELAY_MS);
      }






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
      // Note: Sequential navigation is required because page URLs now use GUIDs
      // instead of sequential numbers, making parallel downloads impossible.
      // This results in slower downloads compared to the previous parallel approach.
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
        const img = await page.waitForSelector('.image-div > img', {
          timeout: this.shelf.options.timeout,
        });
        
        if (!img) {
          throw new ScrapeError('Could not locate scook book page image.');
        }
        pageXUrl = await img.evaluate((img) => (img as HTMLImageElement).src);

        const imgPage = await this.shelf.browser.newPage();

        await imgPage.goto(pageXUrl, {
          waitUntil: 'domcontentloaded',
          timeout: this.shelf.options.timeout,
        });

        // Save current page as pdf
        const pdfFile = this.getPdfPath(dir, pageNo);

        await imgPage.pdf({
          ...(await getPdfOptions(page, options)),
          path: pdfFile,
        });

        downloadedPages++;
        options.onProgress(getProgress());
        await imgPage.close();

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
          await delay(ScookBook.PAGE_NAVIGATION_DELAY_MS);
        }
      }
    } finally {
      await page.close();
    }

    // Merge pdf pages
    options.mergePdfs && (await this.mergePdfPages(dir, pageCount));
  }
}
