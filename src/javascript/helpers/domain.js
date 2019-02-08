'use strict';

import Tabs from './tabs';

export default class Domain {
	static parseURL(url) {
		const parseURL = new URL(url);

		if (['http:', 'https:'].indexOf(parseURL.protocol) === -1) {
			return false;
		}

		return parseURL.hostname.replace(/^www\./, '');
	}

	static async getCurrent() {
		const currentTab = await Tabs.getCurrent();
		return this.parseURL(currentTab.url);
	}
}
