'use strict';

export default class Tabs {
	static async getCurrent() {
		const currentTab = await browser.tabs.query({
			active: true,
			currentWindow: true
		});
		return currentTab[0];
	}

	static async getBlocked() {
		return await browser.tabs.query({
			url: browser.runtime.getURL('*')
		});
	}

	static async restore() {
		// Get current blocked tabs
		const blockedTabs = await this.getBlocked();

		// Loop blocked tabs and reload
		for (let tab of blockedTabs) {
			browser.tabs.reload(tab.id);
		}

		console.log('Tabs restored');
		return;
	}
}
