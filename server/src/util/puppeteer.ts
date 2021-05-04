import { Page } from 'puppeteer';

export const setInputValue = async (page: Page, selector: string, value: string) => {
    await page.waitForSelector(selector);

    await page.evaluate((selector, value) => {
        const element = document.querySelector(selector);
        if (!element) {
            throw new Error(`Input does not exist with selector ${selector}`);
        }
        element.value = value;
    }, selector, value);
};