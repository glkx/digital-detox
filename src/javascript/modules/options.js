'use strict';

import Storage from './storage';

class Options {
	constructor() {
		return new Promise(resolve => {
			// Set default options
			Options.list = Options.default;

			console.log('Construct options', Options.list);

			// Get local and sync browser storage
			Promise.all([Storage.getLocal(), Storage.getSync()]).then(
				values => {
					// Push each array to options list
					values.forEach(value => {
						Options.list.push(value);
					});

					console.log('Update options from storage', Options.list);

					return resolve();
				}
			);
		});
	}

	/**
	 * Update storage when required
	 */
	async handleStorage(key) {
		// When key is part of local or sync storage run update
		if (key.indexOf(this.local) > -1) {
			// Update local storage
			Storage.setLocal(key, this.list[key]);
		} else if (key.indexOf(this.sync) > -1) {
			// Update sync storage
			Storage.setSync(key, this.list[key]);
		}

		return;
	}

	get(key) {
		// get option
	}

	set(key, value) {
		// set option
		// trigger handleStorage for key

		// Trigger storage handling for specific key
		this.handleStorage(key);

		return;
	}
}

Options.default = {
	status: 'on',
	statusModified: 0,
	idleManagement: true,
	processInterval: {
		syncLocalOptions: 1000,
		syncUserOptions: 30000,
		statusInterval: 6000
	},
	updateBlockerInterval: 1000,
	disableDuration: 5400000,
	blockedSites: [
		// Social media
		{
			url: 'facebook.com',
			time: 0
		},
		{
			url: 'tumblr.com',
			time: 0
		},
		{
			url: 'instagram.com',
			time: 0
		},
		{
			url: 'twitter.com',
			time: 0
		},
		{
			url: 'snapchat.com',
			time: 0
		},
		{
			url: 'vk.com',
			time: 0
		},
		{
			url: 'pinterest.com',
			time: 0
		},
		{
			url: 'reddit.com',
			time: 0
		},
		{
			url: 'linkedin.com',
			time: 0
		},
		// Video streaming
		{
			url: 'youtube.com',
			time: 0
		},
		{
			url: 'netflix.com',
			time: 0
		},
		{
			url: 'primevideo.com',
			time: 0
		},
		{
			url: 'hulu.com',
			time: 0
		},
		{
			url: 'hbonow.com',
			time: 0
		},
		{
			url: 'videoland.com',
			time: 0
		},
		{
			url: 'dumpert.nl',
			time: 0
		},
		{
			url: 'dailymotion.com',
			time: 0
		},
		{
			url: 'twitch.tv',
			time: 0
		},
		// Entertainment
		{
			url: '9gag.com',
			time: 0
		},
		{
			url: 'buzzfeed.com',
			time: 0
		}
	],
	history: []
};

Options.local = ['status', 'history'];

Options.sync = ['blockedSites'];

export default Options;
