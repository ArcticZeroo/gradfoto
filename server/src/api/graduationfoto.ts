import puppeteer from 'puppeteer';
import { setInputValue } from '../util/puppeteer';
import { capitalize } from '../util/string';

const defaultWaitOptions: puppeteer.WaitForOptions = {
    waitUntil: 'networkidle2'
};
const baseUrl = 'https://www.graduationfoto.com/';
const openLoginSelector = '#loginhdr a';
const customerNumberInputSelector = '#custnum';
const lastNameInputSelector = '#firstthree';
const loginSubmitButtonSelector = '#logBtn';
const imageSelector = '#imgTable img';
const thumbnailTrimRegex = /t$/;

const proofsButtonSelector = '#proofsBtn a';
const groupPhotoButtonSelector = '#groupPhotoBtn a';
const candidsButtonSelector = '#candidsBtn a';

const loginInfoSelector = '#customerEventInfo';

const paginationSelector = '.pagination';
const currentPageClass = 'currentPg';

export enum Tab {
    proofs,
    groupPhotos,
    candids
}

const tabToSelector = {
    [Tab.proofs]: proofsButtonSelector,
    [Tab.groupPhotos]: groupPhotoButtonSelector,
    [Tab.candids]: candidsButtonSelector
} as const;

export interface IEventData {
    name: string;
    eventName: string;
    eventDate: string;
    orderDeadline: string;
}

export interface IGraduationfotoSessionParams {
    customerId: string;
    lastName: string;
}

export class GraduationfotoSession {
    private readonly _customerNumber: string;
    private readonly _lastName: string;

    browser?: puppeteer.Browser;
    page?: puppeteer.Page;

    constructor({ customerId, lastName }: IGraduationfotoSessionParams) {
        this._customerNumber = customerId;
        this._lastName = capitalize(lastName.padEnd(3, ' ').slice(0, 3));
    }

    private static _toFullResolutionUrl(thumbnailUrl: string) {
        // Literally just removes the "t" on the end of an image URL. In case they have any non-JPG URLs, basically.
        // e.g. [...]/033t.jpg -> [...]/033.jpg
        const thumbnailUrlObject = new URL(thumbnailUrl);
        const thumbnailPathname = thumbnailUrlObject.pathname;
        const [thumbnailName, thumbnailExtension] = thumbnailPathname.split('.');

        if (!thumbnailName || !thumbnailExtension) {
            throw new Error('Thumbnail name or extension are null/empty');
        }

        const imageName = thumbnailName.replace(thumbnailTrimRegex, '');
        return `${thumbnailUrlObject.origin}${imageName}.${thumbnailExtension}`;
    }

    private _requirePage() {
        const page = this.page;

        if (!page) {
            throw new Error('Page cannot be null');
        }

        return page;
    }

    private _pipePageConsole() {
        const page = this._requirePage();

        page.on('console', data => {
            if (data.type() !== 'warning') {
                console.log(data.text());
            }
        });
    }

    async open() {
        this.browser = await puppeteer.launch({
            // I really don't like this. TODO: Resolve by making myself not root on VPS
            args: ['--no-sandbox']
        });
        this.page = await this.browser.newPage();
        await this.page.goto(baseUrl, defaultWaitOptions);
    }

    async login() {
        const page = this._requirePage();

        await setInputValue(page, customerNumberInputSelector, this._customerNumber);
        await setInputValue(page, lastNameInputSelector, this._lastName);

        await Promise.all([
            page.click(loginSubmitButtonSelector),
            page.waitForNavigation(defaultWaitOptions)
        ]);
    }

    async collectPageImageUrls() {
        const page = this._requirePage();

        const rawImageUrls: string[] = await page.evaluate((imageSelector) => {
            const images = document.querySelectorAll(imageSelector);
            return Array.from(images).map(image => image.src);
        }, imageSelector);

        if (!Array.isArray(rawImageUrls) || (rawImageUrls.length && typeof rawImageUrls[0] !== 'string')) {
            throw new Error('page.evaluate did not return an array of strings');
        }

        return rawImageUrls;
    }

    /**
     * Assuming we are starting on page 1, navigate through all pages and collect image URLs for the page.
     */
    async navigatePagesAndCollectImageUrls() {
        const page = this._requirePage();

        const pageCount: number = await page.evaluate((paginationSelector) => {
            return document.querySelector(paginationSelector)?.childElementCount ?? 0;
        }, paginationSelector);

        const allImageUrls = await this.collectPageImageUrls();

        for (let currentPageIndex = 1; currentPageIndex < pageCount; currentPageIndex++) {
            await page.evaluate((currentPageIndex, paginationSelector) => {
                const paginationElement = document.querySelector(paginationSelector);

                if (!paginationElement) {
                    throw new Error('Could not get pagination element.');
                }

                const child = paginationElement.children[currentPageIndex];

                if (!child || !(child instanceof HTMLAnchorElement)) {
                    throw new Error('Child is not an anchor or does not exist');
                }

                child.click();
            }, currentPageIndex, paginationSelector);

            await page.waitForNavigation(defaultWaitOptions);

            const currentPageUrls = await this.collectPageImageUrls();
            allImageUrls.push(...currentPageUrls);
        }

        return allImageUrls;
    }

    async retrieveLoginData(): Promise<IEventData> {
        const page = this._requirePage();

        return await page.evaluate((loginInfoSelector) => {
            const loginInfoElement = document.querySelector(loginInfoSelector);
            const loginInfoText = loginInfoElement.textContent;

            const getInfoLine = (regex: RegExp): string => loginInfoText.match(regex)?.[1] ?? '';

            // I am not certain whether other events have extra/missing data, so it's better to do it like this,
            // which is order-independent.
            const name = getInfoLine(/Graduate:\s*(.+)/);
            const eventName = getInfoLine(/School:\s*(.+)/);
            const eventDate = getInfoLine(/Date:\s*(.+)/);
            const orderDeadline = getInfoLine(/Order Deadline:\s*(.+)/);

            return {
                name,
                eventName,
                eventDate,
                orderDeadline
            };
        }, loginInfoSelector);
    }

    async switchTab(target: Tab) {
        const page = this._requirePage();

        const selector = tabToSelector[target];

        const isPageActive = await page.evaluate((selector, currentPageClass) => {
            const pageLink = document.querySelector(selector);

            if (!pageLink || !(pageLink instanceof HTMLAnchorElement)) {
                throw new Error('Selector did not return a page link');
            }

            return pageLink.classList.contains(currentPageClass);
        }, selector, currentPageClass);

        if (isPageActive) {
            return;
        }

        await page.evaluate((selector) => {
            const pageLink = document.querySelector(selector);

            if (!pageLink || !(pageLink instanceof HTMLAnchorElement)) {
                throw new Error('Selector did not return a page link');
            }

            pageLink.click();
        }, selector);

        await page.waitForNavigation(defaultWaitOptions);
    }
}