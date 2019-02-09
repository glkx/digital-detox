'use strict';

import Tabs from './tabs';

export default class Domain {
	static parseURL(url) {
		const parseURL = new URL(url);

		// Check url is http or https address
		if (['http:', 'https:'].indexOf(parseURL.protocol) === -1) {
			return false;
		}

		// Return domain
		return parseURL.hostname.replace(/^www\./, '');
	}

	static async getCurrent() {
		// Get current active tab
		const currentTab = await Tabs.getCurrent();

		// Parse tab url and return
		return this.parseURL(currentTab.url);
	}
}
