'use strict';

export default class Tabs {
    static async getCurrent() {
        const currentTab = await browser.tabs.query({
            active: true,
            currentWindow: true,
        });

        return currentTab[0];
    }
}
