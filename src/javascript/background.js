const DigitalDetox = {
	/**
	 * Global variables
	 */
	status: 'on',
	localSettings: {

	},
	userSettings: {
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
		]
	}, // used as default for storage
	userSettingsModified: 0,
	userSettingsSyncInterval: 30000, // Interval for timer
	sitesInterval: 1000, // Interval for timer
	sitesTimer: 0,
	disableDuration: 5400000, // 1.5 hours
	disableInterval: 3000, // Interval for timer
	disableModified: 0,
	disableTimer: 0,

	// TODO: Block and restore tabs in background

	/**
	 * Generic error logger.
	 */
	onError: event => {
		console.error(event);
	},

	/**
	 * Starts the blocker. Adds a listener so that if new websites is added
	 * to the blocked list the listener is refreshed.
	 */
	init: () => {
		// Load sites form storage then enable blocker and sync listener
		DigitalDetox.initUserSettings().then(() => {
			// Start blocking
			DigitalDetox.initBlocker();
			// Start listener for sites to sync
			DigitalDetox.setListeners();
		}, DigitalDetox.onError);
	},

	/**
	 * Returns the current status of the extension.
	 */
	getStatus: () => DigitalDetox.status,

	/**
	 * Sets the current status of the extension.
	 * @param string status
	 */
	setStatus: status => {
		DigitalDetox.status = status;

		// Clear auto re-enable blocking in case timer is running
		DigitalDetox.clearAutoEnableBlocker();

		// Set default icon
		var icon = browser.runtime.getURL('/icons/icon-32.svg');

		// When status is off
		if (status === 'off') {
			icon = browser.runtime.getURL('/icons/icon-32-disabled.svg');

			// Automatically re-enable blocking
			DigitalDetox.autoEnableBlocker();
		}

		// Set icon
		browser.browserAction.setIcon({
			path: icon
		});
	},

	/*
	 * Re-enable blocker after set time
	 */
	autoEnableBlocker: () => {
		// Set time of disabling
		DigitalDetox.disableModified = Date.now();

		// Listerner for auto disable
		DigitalDetox.disableTimer = setInterval(() => {
			if (
				Date.now() - DigitalDetox.disableModified >=
				DigitalDetox.disableDuration
			) {
				DigitalDetox.enableBlocker();
			}
		}, DigitalDetox.disableInterval);
	},

	clearAutoEnableBlocker: () => {
		clearInterval(DigitalDetox.disableTimer);
	},

	/**
	 * Listen for new sites array to sync to browser storage
	 */
	setListeners: () => {
		// Get previous sync timestamp
		let previousSync = DigitalDetox.userSettingsModified;

		// Start interval
		setInterval(() => {
			// When previous sync timestamp is updated
			if (DigitalDetox.userSettingsModified !== previousSync) {
				// Stores sites array in browser storage
				DigitalDetox.syncUserSettings();

				// Update previous sync timestamp
				previousSync = DigitalDetox.userSettingsModified;
			}
		}, DigitalDetox.userSettingsSyncInterval);
	},

	/**
	 * Load user settings from storage
	 */
	initUserSettings: () => {
		return browser.storage.sync.get('userSettings').then(storage => {
			if (typeof storage.userSettings !== undefined) {
				DigitalDetox.updateUserSettings(storage.userSettings);
			} else {
				DigitalDetox.prepareUserSettings();
			}
		});
	},

	/**
	 * Initate first sync of user settings to storage
	 */
	prepareUserSettings: () => {
		DigitalDetox.syncUserSettings();
	},

	/**
	 * Get user settings from storage
	 */
	getUserSettings: () => DigitalDetox.userSettings,

	/**
	 * Set user settings from storage
	 */
	updateUserSettings: settings => {
		// When sites are defined
		if (settings !== undefined) {
			// Set global sites array
			DigitalDetox.userSettings = settings;
			DigitalDetox.userSettingsModified = Date.now();
		}
	},

	/**
	 * Sync user settings
	 */
	syncUserSettings: () => {
		// Stores sites array in browser storage
		browser.storage.sync.set({
			userSettings: DigitalDetox.userSettings
		});
	},

	/**
	 * Returns the current loaded sites of the extension.
	 */
	getBlockedSites: () => {
		const sites = DigitalDetox.userSettings.blockedSites,
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
		const userSettings = DigitalDetox.getUserSettings();

		// Add url to blocked websites
		userSettings.blockedSites.push({
			url: url,
			time: time
		});

		// Update user settings
		DigitalDetox.updateUserSettings(userSettings);
	},

	/**
	 * Add a website to the blocked list
	 * @param  {string} url Url to remove to the list
	 */
	removeSite: url => {
		const userSettings = DigitalDetox.getUserSettings();

		userSettings.blockedSites.splice(
			userSettings.blockedSites.findIndex(v => v.url === url),
			1
		);

		DigitalDetox.updateUserSettings(userSettings);
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

		// Clear blocker incase when blocker is already running
		DigitalDetox.clearBlocker();

		if (pattern.length > 0) {
			// Block current tabs
			DigitalDetox.redirectCurrent(pattern);

			// Listen to new tabs
			browser.webRequest.onBeforeRequest.addListener(
				DigitalDetox.redirect,
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

		DigitalDetox.sitesTimer = setInterval(() => {
			let currentSites = JSON.stringify(DigitalDetox.getBlockedSites());
			if (currentSites !== previousSites) {
				DigitalDetox.enableBlocker();
				previousSites = currentSites;
			}
		}, DigitalDetox.sitesInterval);
	},

	/**
	 * Removes the web request listener and turns the extension off.
	 */
	disableBlocker: () => {
		// Restore blocked tabs
		DigitalDetox.restoreCurrent();

		// Remove listeners
		DigitalDetox.clearBlocker();
		DigitalDetox.setStatus('off');
	},

	/*
	 * Clear blocker listeners
	 */
	clearBlocker: () => {
		browser.webRequest.onBeforeRequest.removeListener(
			DigitalDetox.redirect
		);
		clearInterval(DigitalDetox.sitesTimer);
	},

	/**
	 * Redirect current tabs
	 */
	redirectCurrent: urls => {
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
	redirect: requestDetails => {
		let matchFound = true; // By default url is catched correctly

		// Test url on false positive when url components are found
		if (requestDetails.url.match(/[?#]./)) {
			const sites = DigitalDetox.getBlockedSites();
			const matchUrl = new URL(requestDetails.url);
			const matchDomain = matchUrl.hostname.replace(/^www\./, '');

			// Catch url that are false positive for example when a url has a url as component
			if (!sites.includes(matchDomain)) {
				matchFound = false;
			}
		}

		if (matchFound === true) {
			browser.tabs.update(requestDetails.tabId, {
				url: browser.runtime.getURL(
					'/redirect.html?from=' +
						encodeURIComponent(btoa(requestDetails.url))
				)
			});
		}
	},

	/**
	 * Restore current tabs
	 */
	restoreCurrent: () => {
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
	}
};

DigitalDetox.init();

// Helper functions to access object literal from popup.js file. These funcitons are
// easily accessible from the getBackgroundPage instance.
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

function syncUserSettings() {
	return DigitalDetox.syncUserSettings();
}

function getUserSettings() {
	return DigitalDetox.getUserSettings();
}

function refreshUserSettings() {
	return DigitalDetox.initUserSettings();
}

function getBlockedSites() {
	return DigitalDetox.getBlockedSites();
}

function getAllSites() {
	return DigitalDetox.getUserSettings().blockedSites;
}

function addSite(url) {
	return DigitalDetox.addSite(url);
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
