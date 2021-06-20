'use strict';

export default class Tabs {
	static async getCurrent() {
		const currentTab = await browser.tabs.query({
			active: true,
			currentWindow: true
		});
		return currentTab[0];
	}

	/**
	 * Get all blocked tabs
	 *
	 * @return  array  Information about each matching tab.
	 */
	static async getBlocked() {
		return await browser.tabs.query({
			url: browser.runtime.getURL('*')
		});
	}

	/**
	 * Get all blocked tabs that are in memory
	 *
	 * @return  array  Information about each matching tab.
	 */
	static async getBlockedInMemory() {
		return await browser.tabs.query({
			url: browser.runtime.getURL('*'),
			discarded: false, // Excluded tabs that are unloaded
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
		const blockedTabs = await this.getBlockedInMemory();

		// Loop blocked tabs and reload
		for (let tab of blockedTabs) {
			browser.tabs.reload(tab.id);
		}

		console.log('Tabs restored');
		return;
	}
}
