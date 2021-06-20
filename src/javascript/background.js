'use strict';

// Variables
import runtimeMessage from './variables/runtimeMessages';

// Modules
import Domain from './modules/domain';
import Tabs from './modules/tabs';

// Helper classes
import Interval from './helpers/interval';

// Helper functions
import equalArrays from './helpers/equal-arrays';

// Vendor
import dayjs from 'dayjs';

/**
 * Digital Detox
 */
const DigitalDetox = {
	init: () => {
		console.log('Initiate Digital Detox');

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
		console.log('Load options started');

		// Wait for local and user options are loaded
		return new Promise((resolve) => {
			Promise.all([
				DigitalDetox.loadLocalOptions(),
				DigitalDetox.loadUserOptions(),
			]).then(() => {
				console.log('Load options finished');
				return resolve();
			});
		});
	},

	// Load local options from local storage
	loadLocalOptions: () => {
		return new Promise((resolve) => {
			browser.storage.local.get('localOptions').then((storage) => {
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
		return new Promise((resolve) => {
			// NOTE: userSettings was old variable for userOptions
			browser.storage.sync.get('userSettings').then((storage) => {
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

			console.log('Update local options');
		}
	},

	/**
	 * Sync user settings
	 */
	syncLocalOptions: () => {
		// Stores sites array in browser storage
		browser.storage.local.set({
			localOptions: DigitalDetox.localOptions,
		});

		console.log('Sync local options');
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

			console.log('Update user options');
		}
	},

	/**
	 * Sync user settings
	 */
	syncUserOptions: () => {
		// Stores sites array in browser storage
		browser.storage.sync.set({
			userSettings: DigitalDetox.userOptions,
		});

		console.log('Sync user options');
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
			syncUserOptions: 0,
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

		// Auto change status blocker
		DigitalDetox.process.statusIntervalFast = new Interval(
			DigitalDetox.handleStatus,
			DigitalDetox.options.processInterval.statusInterval
		);

		if (DigitalDetox.options.idleManagement === true) {
			// When system is idle slow status blocker handler is started with interval 10 times longer
			DigitalDetox.process.statusIntervalSlow = new Interval(
				DigitalDetox.handleStatus,
				DigitalDetox.options.processInterval.statusInterval * 10,
				false
			);

			// Pause background processes when user is inactive
			browser.idle.onStateChanged.addListener((state) => {
				if (state === 'idle' || state === 'locked') {
					DigitalDetox.process.syncLocalOptions.pause();
					DigitalDetox.process.syncUserOptions.pause();
					DigitalDetox.process.statusIntervalFast.pause();
					DigitalDetox.process.statusIntervalSlow.start();
				} else if (state === 'active') {
					DigitalDetox.process.syncLocalOptions.start();
					DigitalDetox.process.syncUserOptions.start();
					DigitalDetox.process.statusIntervalFast.start();
					DigitalDetox.process.statusIntervalSlow.pause();
				}
			});
		}

		// Counting visits
		browser.webRequest.onBeforeRequest.addListener(
			DigitalDetox.handleVisit,
			{
				urls: ['<all_urls>'],
				types: ['main_frame'],
			}
		);
	},

	handleStatus: () => {
		let blockerStatus = DigitalDetox.getStatus();

		if (blockerStatus == 'off') {
			let userOptions = DigitalDetox.getUserOptions(),
				disableDuration =
					userOptions.disableDuration != undefined
						? userOptions.disableDuration
						: DigitalDetox.options.disableDuration;

			// When maximum time is exceded
			if (
				Date.now() - DigitalDetox.getLocalOptions().statusModified >=
				disableDuration
			) {
				DigitalDetox.enableBlocker();
			}
		} else if (blockerStatus == 'on') {
			// IDEA: Auto disable blocker between time range
		}

		console.log('Status handled');
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
	setStatus: (status) => {
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
			path: icon,
		});

		console.log('Set status', status);
		return true;
	},

	getHistory: () => {
		const localOptions = DigitalDetox.getLocalOptions();

		let history =
			localOptions.history != undefined
				? localOptions.history
				: DigitalDetox.options.history;

		// Reset history when new day
		if (
			localOptions.historyModified == undefined ||
			dayjs(localOptions.historyModified).isBefore(dayjs(), 'day')
		) {
			history = DigitalDetox.options.history;
			console.log('Reset history');
		}

		console.log('Get history', history);
		return history;
	},

	updateHistory: (history) => {
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

		sites.forEach((site) => {
			blockedSites.push(site.url);
			// IDEA: Implement time logic
		});

		console.log('Get blocked sites', blockedSites);
		return blockedSites;
	},

	/**
	 * Add a website to the blocked list
	 * @param  {string} url Url to add to the list
	 */
	addSite: (url, time = 0) => {
		const userOptions = DigitalDetox.getUserOptions();

		// Check if url already exists
		if (userOptions.blockedSites.findIndex((v) => v.url === url) === -1) {
			// Parse time
			time = parseInt(time, 0);

			// Add url to blocked websites
			userOptions.blockedSites.push({
				url: url,
				time: time,
			});

			// Update user settings
			DigitalDetox.updateUserOptions(userOptions);

			console.log('Site added');
			return true;
		}

		return new Error('Url already exists.');
	},

	/**
	 * Add a website to the blocked list
	 * @param  {string} url Url to remove to the list
	 */
	removeSite: (url) => {
		const userOptions = DigitalDetox.getUserOptions();

		userOptions.blockedSites.splice(
			userOptions.blockedSites.findIndex((v) => v.url === url),
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
			pattern = sites.map((item) => `*://*.${item}/*`);

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
					types: ['main_frame'],
				},
				['blocking']
			);
		}

		// Enable blocker auto update
		DigitalDetox.autoUpdateBlocker();

		// Change status to on
		DigitalDetox.setStatus('on');

		console.log('Blocker enabled');
	},

	/*
	 * Update blocker when sites array is modified
	 */
	autoUpdateBlocker: () => {
		let previousSites = DigitalDetox.getBlockedSites();

		DigitalDetox.process.updateBlockerTimer = new Interval(() => {
			console.log('Check for blocker updates');

			let currentSites = DigitalDetox.getBlockedSites();
			if (equalArrays(previousSites, currentSites) === false) {
				DigitalDetox.enableBlocker();
				previousSites = currentSites;

				console.log('Blocker updated');
			}
		}, DigitalDetox.options.updateBlockerInterval);

		// Pause background processes when user is inactive
		// NOTE: Currently updating blocker in background is not needed in future it can be the case
		/* if (DigitalDetox.options.idleManagement === true) {
			browser.idle.onStateChanged.addListener(state => {
				if (DigitalDetox.process.updateBlockerTimer != undefined) {
					if (state === 'idle' || state === 'locked') {
						DigitalDetox.process.updateBlockerTimer.pause();
					} else if (state === 'active') {
						DigitalDetox.process.updateBlockerTimer.start();
					}
				}
			});
		} */
	},

	/**
	 * Removes the web request listener and turns the extension off.
	 */
	disableBlocker: () => {
		console.log('Disable blocker');

		// Restore blocked tabs
		Tabs.restore();

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
		if (DigitalDetox.process.updateBlockerTimer != undefined) {
			DigitalDetox.process.updateBlockerTimer.delete();
			DigitalDetox.process.updateBlockerTimer = null;
		}

		console.log('Blocker cleared');
	},

	/**
	 * Redirect current tabs
	 */
	redirectCurrentTab: (urls) => {
		browser.tabs
			.query({
				url: urls,
				audible: false, // Tabs playing video or audio
				pinned: false, // Pinned tabs
			})
			.then((tabs) => {
				// Loop matched tabs
				for (let tab of tabs) {
					// Block tabs
					Tabs.setBlocked(tab.id, tab.url);
				}
			});
	},

	/**
	 * Redirects the tab to local "You have been blocked" page.
	 */
	redirectTab: (requestDetails) => {
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
			Tabs.setBlocked(requestDetails.tabId, requestDetails.url);
		}
	},

	// Listen to new tabs
	handleVisit: (requestDetails) => {
		const domain = Domain.parseURL(requestDetails.url),
			history = DigitalDetox.getHistory();

		if (history != undefined) {
			const status = DigitalDetox.getStatus(),
				domainIndex = history.findIndex((v) => v.url === domain);

			if (domainIndex > -1) {
				if (status == 'off') {
					if (history[domainIndex].visits != undefined) {
						history[domainIndex].visits =
							history[domainIndex].visits + 1;
					} else {
						history[domainIndex].visits = 1;
					}
				} else if (status == 'on') {
					if (history[domainIndex].blocks != undefined) {
						history[domainIndex].blocks =
							history[domainIndex].blocks + 1;
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
					date: Date.now(),
				});
			}

			// Update history
			DigitalDetox.updateHistory(history);
		}

		console.log('Visit handled');
	},

	/**
	 * Generic error logger.
	 */
	onError: (event) => {
		console.error(event);
	},
};

// Default options
DigitalDetox.options = {
	status: 'on',
	idleManagement: true,
	processInterval: {
		syncLocalOptions: 1000,
		syncUserOptions: 30000,
		statusInterval: 6000,
	},
	updateBlockerInterval: 1000,
	disableDuration: 5400000,
	history: [],
};

// Default local options
DigitalDetox.localOptions = {
	status: null,
	statusModified: 0,
	history: null,
};

// Default user options meant to be synct
DigitalDetox.userOptions = {
	blockedSites: [
		// Social media
		{
			url: 'facebook.com',
			time: 0,
		},
		{
			url: 'tumblr.com',
			time: 0,
		},
		{
			url: 'instagram.com',
			time: 0,
		},
		{
			url: 'twitter.com',
			time: 0,
		},
		{
			url: 'snapchat.com',
			time: 0,
		},
		{
			url: 'vk.com',
			time: 0,
		},
		{
			url: 'pinterest.com',
			time: 0,
		},
		{
			url: 'reddit.com',
			time: 0,
		},
		{
			url: 'linkedin.com',
			time: 0,
		},
		// Video streaming
		{
			url: 'youtube.com',
			time: 0,
		},
		{
			url: 'netflix.com',
			time: 0,
		},
		{
			url: 'primevideo.com',
			time: 0,
		},
		{
			url: 'hulu.com',
			time: 0,
		},
		{
			url: 'hbonow.com',
			time: 0,
		},
		{
			url: 'videoland.com',
			time: 0,
		},
		{
			url: 'dumpert.nl',
			time: 0,
		},
		{
			url: 'dailymotion.com',
			time: 0,
		},
		{
			url: 'twitch.tv',
			time: 0,
		},
		// Entertainment
		{
			url: '9gag.com',
			time: 0,
		},
		{
			url: 'buzzfeed.com',
			time: 0,
		},
	],
	disableDuration: null, // TODO: Add disable duration to options page
};

DigitalDetox.init();

/**
 * Messages
 */

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.type) {
		case runtimeMessage.getStatus:
			sendResponse(DigitalDetox.getStatus());
			break;

		case runtimeMessage.disableBlocker:
			sendResponse(DigitalDetox.disableBlocker());
			break;

		case runtimeMessage.enableBlocker:
			sendResponse(DigitalDetox.enableBlocker());
			break;

		case runtimeMessage.getCurrentDomain:
			sendResponse(Domain.getCurrent());
			break;

		case runtimeMessage.getLocalOptions:
			sendResponse(DigitalDetox.getLocalOptions());
			break;

		case runtimeMessage.getUserOptions:
			sendResponse(DigitalDetox.getUserOptions());
			break;

		case runtimeMessage.syncUserOptions:
			sendResponse(DigitalDetox.syncUserOptions());
			break;

		case runtimeMessage.getBlockedSites:
			sendResponse(DigitalDetox.getBlockedSites());
			break;

		case runtimeMessage.getAllSites:
			sendResponse(DigitalDetox.getUserOptions().blockedSites);
			break;

		case runtimeMessage.getHistory:
			sendResponse(DigitalDetox.getLocalOptions().history);
			break;

		case runtimeMessage.resetHistory:
			// Empty history
			DigitalDetox.updateLocalOptions(
				'history',
				DigitalDetox.options.history
			);

			// Update history modification date
			DigitalDetox.updateLocalOptions('historyModified', Date.now());

			sendResponse(true);
			break;

		case runtimeMessage.addSite:
			sendResponse(DigitalDetox.addSite(request.url, request.time));
			break;

		case runtimeMessage.removeSite:
			sendResponse(DigitalDetox.removeSite(request.url));
			break;

		default:
			sendResponse(new Error('Message request type does not exist'));
			break;
	}

	return;
});
