'use strict';

export default class Storage {
	/**
	 * Get local storage
	 */
	static async getLocal() {
		const storage = await browser.storage.local.get('localOptions');

		if (typeof storage != undefined && storage != undefined) {
			return storage;
		}

		return;
	}

	async setLocal() {

	}

	/**
	 * Get sync storage
	 */
	static async getSync() {
		// NOTE: userSettings was old variable for userOptions
		const storage = await browser.storage.sync.get('userSettings');

		if (typeof storage != undefined && storage != undefined) {
			return storage;
		}

		return;
	}

	async setSync() {

	}
}
