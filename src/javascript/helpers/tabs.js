'use strict';

class Tabs {
    static async getCurrentTab() {
        const currentTab = await browser.tabs.query({
            active: true,
            currentWindow: true,
        });

        return currentTab[0];
    }

    static async getCurrentDomain() {
        const currentTab = await this.getCurrentTab(),
            currentUrl = new URL(currentTab.url);

        if (['http:', 'https:'].indexOf(currentUrl.protocol) === -1) {
            return false;
        }

        return currentUrl.hostname.replace(/^www\./, '');
    }
}

export { Tabs };
