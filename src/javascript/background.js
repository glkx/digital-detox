'use strict';

const DigitalDetox = {
	init: () => {
		// Load sites form storage then enable blocker and sync listener
		DigitalDetox.loadOptions().then(() => {
			// Initiate blocker
			DigitalDetox.initBlocker();
			// Process handling like sync
			DigitalDetox.startProcesses();
		}, DigitalDetox.onError);
	},

	/**
	 * Initiate options
	 */
	loadOptions: () => {
		// Wait for local and user options are loaded
		return new Promise((resolve, reject) => {
			Promise.all([
				DigitalDetox.loadLocalOptions(),
				DigitalDetox.loadUserOptions()
			]).then(() => {
				return resolve();
			});
		});
	},

	// Load local options from local storage
	loadLocalOptions: () => {
		return new Promise((resolve, reject) => {
			browser.storage.local.get('localOptions').then(storage => {
				if (
					typeof storage.localOptions != undefined &&
					storage.localOptions != undefined
				) {
					DigitalDetox.localOptions = storage.localOptions;
				}
				return resolve();
			});
		});
	},

	// Load user options from sync storage
	loadUserOptions: () => {
		return new Promise((resolve, reject) => {
			// NOTE: userSettings was old variable for userOptions
			browser.storage.sync.get('userSettings').then(storage => {
				if (
					typeof storage.userSettings != undefined &&
					storage.userSettings != undefined
				) {
					DigitalDetox.userOptions = storage.userSettings;
				}
				return resolve();
			});
		});
	},

	/**
	 * Get local options
	 */
	getLocalOptions: () => DigitalDetox.localOptions,

	/**
	 * Set user settings from storage
	 */
	updateLocalOptions: (options, value = null) => {
		// When sites are defined
		if (options != undefined) {
			if (value != undefined) {
				DigitalDetox.localOptions[options] = value;
			} else {
				DigitalDetox.localOptions = options;
			}
			DigitalDetox.localOptionsModified = Date.now();
		}
	},

	/**
	 * Sync user settings
	 */
	syncLocalOptions: () => {
		// Stores sites array in browser storage
		browser.storage.local.set({
			localOptions: DigitalDetox.localOptions
		});
	},

	/**
	 * Get user options
	 */
	getUserOptions: () => DigitalDetox.userOptions,

	/**
	 * Update user options
	 */
	updateUserOptions: (options, value = null) => {
		// When sites are defined
		if (options != undefined) {
			// Set global sites array
			if (value != undefined) {
				DigitalDetox.userOptions[options] = value;
			} else {
				DigitalDetox.userOptions = options;
			}
			DigitalDetox.userOptionsModified = Date.now();
		}
	},

	/**
	 * Sync user settings
	 */
	syncUserOptions: () => {
		// Stores sites array in browser storage
		browser.storage.sync.set({
			userSettings: DigitalDetox.userOptions
		});
	},

	/**
	 * Processes
	 */
	process: {},

	/**
	 * Process runner
	 */
	startProcesses: () => {
		// Process times
		let processLastRuntime = {
			syncLocalOptions: 0,
			syncUserOptions: 0
		};

		// Sync local options
		DigitalDetox.process.syncLocalOptions = new Interval(() => {
			// When previous sync timestamp is updated
			if (
				DigitalDetox.localOptionsModified != undefined &&
				DigitalDetox.localOptionsModified !=
					processLastRuntime.syncLocalOptions
			) {
				// Stores sites array in browser storage
				DigitalDetox.syncLocalOptions();

				// Update previous sync timestamp
				processLastRuntime.syncLocalOptions =
					DigitalDetox.localOptionsModified;
			}
		}, DigitalDetox.options.processInterval.syncLocalOptions);

		DigitalDetox.process.syncLocalOptions.start();

		// Sync user options
		DigitalDetox.process.syncUserOptions = new Interval(() => {
			// When previous sync timestamp is updated
			if (
				DigitalDetox.userOptionsModified != undefined &&
				DigitalDetox.userOptionsModified !=
					processLastRuntime.syncUserOptions
			) {
				// Stores sites array in browser storage
				DigitalDetox.syncUserOptions();

				// Update previous sync timestamp
				processLastRuntime.syncUserOptions =
					DigitalDetox.userOptionsModified;
			}
		}, DigitalDetox.options.processInterval.syncUserOptions);

		DigitalDetox.process.syncUserOptions.start();

		// Auto change status blocker
		DigitalDetox.process.statusInterval = new Interval(() => {
			let blockerStatus = DigitalDetox.getStatus();

			if (blockerStatus == 'off') {
				let userOptions = DigitalDetox.getUserOptions(),
					disableDuration =
						userOptions.disableDuration != undefined
							? userOptions.disableDuration
							: DigitalDetox.options.disableDuration;

				// When maximum time is exceded
				if (
					Date.now() -
						DigitalDetox.getLocalOptions().statusModified >=
					disableDuration
				) {
					DigitalDetox.enableBlocker();
				}
			} else if (blockerStatus == 'on') {
				// IDEA: Auto disable blocker between time range
			}
		}, DigitalDetox.options.processInterval.statusInterval);

		DigitalDetox.process.statusInterval.start();

		// Pause background processes when user is inactive
		browser.idle.onStateChanged.addListener(state => {
		  	if (state === 'idle' || state === 'locked') {
				DigitalDetox.process.syncLocalOptions.pause();
				DigitalDetox.process.syncUserOptions.pause();
				DigitalDetox.process.statusInterval.pause();
			} else if (state === 'active') {
				DigitalDetox.process.syncLocalOptions.start();
				DigitalDetox.process.syncUserOptions.start();
				DigitalDetox.process.statusInterval.start();
			}
		});

		// Counting visits
		browser.webRequest.onBeforeRequest.addListener(
			DigitalDetox.handleVisit,
			{
				urls: ['<all_urls>'],
				types: ['main_frame']
			}
		);
	},

	/**
	 * Returns the current status of the extension.
	 */
	getStatus: () => {
		return DigitalDetox.getLocalOptions().status != undefined
			? DigitalDetox.getLocalOptions().status
			: DigitalDetox.options.status;
	},

	/**
	 * Sets the current status of the extension.
	 * @param string status
	 */
	setStatus: status => {
		// Change local status
		DigitalDetox.updateLocalOptions('status', status);
		// Change status moditication time
		DigitalDetox.updateLocalOptions('statusModified', Date.now());

		// Set default icon
		let icon = browser.runtime.getURL('/icons/icon-32.svg');

		// When status is off
		if (status === 'off') {
			icon = browser.runtime.getURL('/icons/icon-32-disabled.svg');
		}

		// Set icon
		browser.browserAction.setIcon({
			path: icon
		});
	},

	getHistory: () => {
		const localOptions = DigitalDetox.getLocalOptions();

		let history =
			localOptions.history != undefined
				? localOptions.history
				: DigitalDetox.options.history;

		// Reset history when new day
		if (
			localOptions.historyModified != undefined &&
			new Date(localOptions.historyModified).getDate() !=
				new Date().getDate()
		) {
			history = DigitalDetox.options.history;
		}

		return history;
	},

	updateHistory: history => {
		if (history != undefined) {
			// Update history
			DigitalDetox.updateLocalOptions('history', history);
			// Change history moditication time
			DigitalDetox.updateLocalOptions('historyModified', Date.now());
		}
	},

	/**
	 * Returns the current loaded sites of the extension.
	 */
	getBlockedSites: () => {
		const sites = DigitalDetox.getUserOptions().blockedSites,
			blockedSites = [];

		sites.forEach(site => {
			blockedSites.push(site.url);
			// IDEA: Implement time logic
		});

		return blockedSites;
	},

	/**
	 * Add a website to the blocked list
	 * @param  {string} url Url to add to the list
	 */
	addSite: (url, time = 0) => {
		const userOptions = DigitalDetox.getUserOptions();

		// Check if url already exists
		if (userOptions.blockedSites.findIndex(v => v.url === url) === -1) {
			// Parse time
			time = parseInt(time, 0);

			// Add url to blocked websites
			userOptions.blockedSites.push({
				url: url,
				time: time
			});

			// Update user settings
			DigitalDetox.updateUserOptions(userOptions);

			return true;
		}

		return new Error('Url already exists.');
	},

	/**
	 * Add a website to the blocked list
	 * @param  {string} url Url to remove to the list
	 */
	removeSite: url => {
		const userOptions = DigitalDetox.getUserOptions();

		userOptions.blockedSites.splice(
			userOptions.blockedSites.findIndex(v => v.url === url),
			1
		);

		DigitalDetox.updateUserOptions(userOptions);
	},

	initBlocker: () => {
		// IDEA: Based on settings enable or disable blocker by default
		// Enable blocker
		DigitalDetox.enableBlocker();
	},

	/**
	 * Fetches blocked websites lists, attaches them to the listener provided by the WebExtensions API
	 */
	enableBlocker: () => {
		const sites = DigitalDetox.getBlockedSites(),
			pattern = sites.map(item => `*://*.${item}/*`);

		// console.log(pattern);

		// Clear blocker incase when blocker is already running
		DigitalDetox.clearBlocker();

		if (pattern.length > 0) {
			// Block current tabs
			DigitalDetox.redirectCurrentTab(pattern);

			// Listen to new tabs
			browser.webRequest.onBeforeRequest.addListener(
				DigitalDetox.redirectTab,
				{
					urls: pattern,
					types: ['main_frame']
				},
				['blocking']
			);
		}

		// Enable blocker auto update
		DigitalDetox.autoUpdateBlocker();

		// Change status to on
		DigitalDetox.setStatus('on');
	},

	/*
	 * Update blocker when sites array is modified
	 */
	autoUpdateBlocker: () => {
		let previousSites = JSON.stringify(DigitalDetox.getBlockedSites());

		DigitalDetox.updateBlockerTimer = new Interval(() => {
			let currentSites = JSON.stringify(DigitalDetox.getBlockedSites());
			if (currentSites !== previousSites) {
				DigitalDetox.enableBlocker();
				previousSites = currentSites;
			}
		}, DigitalDetox.options.updateBlockerInterval);

		DigitalDetox.updateBlockerTimer.start();

		// Pause background processes when user is inactive
		// NOTE: Currently updating blocker in background is not needed in future it can be the case
		browser.idle.onStateChanged.addListener(state => {
		  	if (state === 'idle' || state === 'locked') {
				DigitalDetox.updateBlockerTimer.pause();
			} else if (state === 'active') {
				DigitalDetox.updateBlockerTimer.start();
			}
		});
	},

	/**
	 * Removes the web request listener and turns the extension off.
	 */
	disableBlocker: () => {
		// Restore blocked tabs
		DigitalDetox.restoreTabs();

		// Remove listeners
		DigitalDetox.clearBlocker();
		DigitalDetox.setStatus('off');
	},

	/*
	 * Clear blocker listeners
	 */
	clearBlocker: () => {
		browser.webRequest.onBeforeRequest.removeListener(
			DigitalDetox.redirectTab
		);

		// Delete interval
		delete DigitalDetox.updateBlockerTimer;
	},

	/**
	 * Redirect current tabs
	 */
	redirectCurrentTab: urls => {
		browser.tabs
			.query({
				url: urls,
				audible: false,
				pinned: false
			})
			.then(tabs => {
				// Loop matched tabs
				for (let tab of tabs) {
					// Block tabs
					browser.tabs.update(tab.id, {
						url: browser.runtime.getURL(
							'/redirect.html?from=' +
								encodeURIComponent(btoa(tab.url))
						)
					});
				}
			});
	},

	/**
	 * Redirects the tab to local "You have been blocked" page.
	 */
	redirectTab: requestDetails => {
		let match = true; // By default url is catched correctly

		// Test url on false positive when url components are found
		if (requestDetails.url.match(/[?#]./)) {
			const sites = DigitalDetox.getBlockedSites(),
				url = new URL(requestDetails.url),
				domain = url.hostname.replace(/^www\./, '');

			// Catch url that are false positive for example when a url has a url as component
			if (!sites.includes(domain)) {
				match = false;
			}
		}

		if (match === true) {
			browser.tabs.update(requestDetails.tabId, {
				url: browser.runtime.getURL(
					'/redirect.html?from=' +
						encodeURIComponent(btoa(requestDetails.url))
				)
			});
		}
	},

	/**
	 * Restore tabs
	 */
	restoreTabs: () => {
		browser.tabs
			.query({
				url: browser.runtime.getURL('*')
			})
			.then(tabs => {
				// Loop matched tabs
				for (let tab of tabs) {
					// Reload tabs
					browser.tabs.reload(tab.id);
				}
			});
	},

	// Listen to new tabs
	handleVisit: requestDetails => {
		const url = new URL(requestDetails.url),
			domain = url.hostname.replace(/^www\./, ''),
			history = DigitalDetox.getHistory();

		if (history != undefined) {
			const status = DigitalDetox.getStatus(),
				domainIndex = history.findIndex(v => v.url === domain);

			if (domainIndex > -1) {
				if (status == 'off') {
					if (history[domainIndex].visits != undefined) {
						history[domainIndex].visits = history[domainIndex].visits + 1;
					} else {
						history[domainIndex].visits = 1;
					}
				} else if (status == 'on') {
					if (history[domainIndex].blocks != undefined) {
						history[domainIndex].blocks = history[domainIndex].blocks + 1;
					} else {
						history[domainIndex].blocks = 1;
					}
				}
				history[domainIndex].date = Date.now();
			} else {
				// Add url to blocked websites
				history.push({
					url: domain,
					visits: status == 'off' ? 1 : 0,
					blocks: status == 'on' ? 1 : 0,
					date: Date.now()
				});
			}

			// Update history
			DigitalDetox.updateHistory(history);
		}
	},

	/**
	 * Generic error logger.
	 */
	onError: event => {
		console.error(event);
	}
};

// Default options
DigitalDetox.options = {
	status: 'on',
	processInterval: {
		syncLocalOptions: 1000,
		syncUserOptions: 30000,
		statusInterval: 6000
	},
	updateBlockerInterval: 1000,
	disableDuration: 5400000,
	history: []
};

// Default local options
DigitalDetox.localOptions = {
	status: null,
	statusModified: 0,
	history: null
};

// Default user options meant to be synct
DigitalDetox.userOptions = {
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
	disableDuration: null // TODO: Add disable duration to options page
};

DigitalDetox.init();

/**
 * Helper classes
 */

class Interval {
	constructor(callback, interval) {
		this.callback = callback;
		this.interval = interval;
		this.timerId;
	}

	pause() {
		clearTimeout(this.timerId);
	}

	start() {
		this.timerId = setInterval(this.callback, this.interval);
	}
}

/**
 * Helper functions
 */

function getStatus() {
	return DigitalDetox.getStatus();
}

function disableBlocker() {
	DigitalDetox.disableBlocker();
}

function enableBlocker() {
	DigitalDetox.enableBlocker();
}

function getDomain() {
	return browser.tabs.query({
		active: true,
		currentWindow: true
	});
}

function refreshOptions() {
	return DigitalDetox.loadOptions();
}

function getUserOptions() {
	return DigitalDetox.getUserOptions();
}

function syncUserOptions() {
	return DigitalDetox.syncUserOptions();
}

function getBlockedSites() {
	return DigitalDetox.getBlockedSites();
}

function getAllSites() {
	return DigitalDetox.getUserOptions().blockedSites;
}

function getHistory() {
	return DigitalDetox.getLocalOptions().history;
}

function resetHistory() {
	// Empty history
	DigitalDetox.updateLocalOptions('history', DigitalDetox.options.history);
	// Update history modification date
	DigitalDetox.updateLocalOptions('historyModified', Date.now());
}

function addSite(url, time) {
	return DigitalDetox.addSite(url, time);
}

function removeSite(url) {
	return DigitalDetox.removeSite(url);
}

function addCurrentlyActiveSite() {
	const gettingActiveTab = getDomain();
	return gettingActiveTab.then(tabs => {
		const url = new URL(tabs[0].url);
		addSite(url.hostname.replace(/^www\./, ''));
	});
}

function removeCurrentlyActiveSite() {
	const gettingActiveTab = getDomain();
	return gettingActiveTab.then(tabs => {
		const url = new URL(tabs[0].url);
		removeSite(url.hostname.replace(/^www\./, ''));
	});
}
