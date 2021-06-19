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

	static async setBlocked(tabId, tabUrl) {
		if (!tabId || !tabUrl) {
			console.log('Tab ID or url missing');
			return;
		}

		// Redirect tab to blocked message
		return await browser.tabs.update(tabId, {
			url: browser.runtime.getURL(
				'/redirect.html?from=' + encodeURIComponent(btoa(tabUrl))
			)
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
