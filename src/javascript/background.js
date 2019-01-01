const ImpulseBlocker = {
	/**
	 * Global variables
	 */
	status: 'on',
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
		ImpulseBlocker.loadUserSettings().then(() => {
			// Start blocking
			ImpulseBlocker.setBlocker();
			// Start listener for sites to sync
			ImpulseBlocker.syncListener();
		}, ImpulseBlocker.onError);
	},

	/**
	 * Returns the current status of the extension.
	 */
	getStatus: () => ImpulseBlocker.status,

	/**
	 * Sets the current status of the extension.
	 * @param string status
	 */
	setStatus: status => {
		ImpulseBlocker.status = status;

		// Clear auto re-enable blocking in case timer is running
		ImpulseBlocker.clearAutoEnableBlocker();

		// Set default icon
		var icon = browser.runtime.getURL('/icons/icon-32.svg');

		// When status is off
		if (status === 'off') {
			icon = browser.runtime.getURL('/icons/icon-32-disabled.svg');

			// Automatically re-enable blocking
			ImpulseBlocker.autoEnableBlocker();
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
		ImpulseBlocker.disableModified = Date.now();

		// Listerner for auto disable
		ImpulseBlocker.disableTimer = setInterval(() => {
			if (
				Date.now() - ImpulseBlocker.disableModified >=
				ImpulseBlocker.disableDuration
			) {
				ImpulseBlocker.setBlocker();
			}
		}, ImpulseBlocker.disableInterval);
	},

	clearAutoEnableBlocker: () => {
		clearInterval(ImpulseBlocker.disableTimer);
	},

	/**
	 * Listen for new sites array to sync to browser storage
	 */
	syncListener: () => {
		// Get previous sync timestamp
		let previousSync = ImpulseBlocker.userSettingsModified;

		// Start interval
		setInterval(() => {
			// When previous sync timestamp is updated
			if (ImpulseBlocker.userSettingsModified !== previousSync) {
				// Stores sites array in browser storage
				ImpulseBlocker.syncUserSettings();

				// Update previous sync timestamp
				previousSync = ImpulseBlocker.userSettingsModified;
			}
		}, ImpulseBlocker.userSettingsSyncInterval);
	},

	/**
	 * Load user settings from storage
	 */
	loadUserSettings: () => {
		return browser.storage.sync.get('userSettings').then(storage => {
			if (typeof storage.userSettings !== undefined) {
				ImpulseBlocker.setUserSettings(storage.userSettings);
			} else {
				ImpulseBlocker.prepareUserSettings();
			}
		});
	},

	/**
	 * Initate first sync of user settings to storage
	 */
	prepareUserSettings: () => {
		ImpulseBlocker.syncUserSettings();
	},

	/**
	 * Get user settings from storage
	 */
	getUserSettings: () => ImpulseBlocker.userSettings,

	/**
	 * Set user settings from storage
	 */
	setUserSettings: settings => {
		// When sites are defined
		if (settings !== undefined) {
			// Set global sites array
			ImpulseBlocker.userSettings = settings;
			ImpulseBlocker.userSettingsModified = Date.now();
		}
	},

	/**
	 * Sync user settings
	 */
	syncUserSettings: () => {
		// Stores sites array in browser storage
		browser.storage.sync.set({
			userSettings: ImpulseBlocker.userSettings
		});
	},

	/**
	 * Returns the current loaded sites of the extension.
	 */
	getBlockedSites: () => {
		const sites = ImpulseBlocker.userSettings.blockedSites,
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
		const userSettings = ImpulseBlocker.getUserSettings();

		// Add url to blocked websites
		userSettings.blockedSites.push({
			url: url,
			time: time
		});

		// Update user settings
		ImpulseBlocker.setUserSettings(userSettings);
	},

	/**
	 * Add a website to the blocked list
	 * @param  {string} url Url to remove to the list
	 */
	removeSite: url => {
		const userSettings = ImpulseBlocker.getUserSettings();

		userSettings.blockedSites.splice(
			userSettings.blockedSites.findIndex(v => v.url === url),
			1
		);

		ImpulseBlocker.setUserSettings(userSettings);
	},

	/**
	 * Fetches blocked websites lists, attaches them to the listener provided by the WebExtensions API
	 */
	setBlocker: () => {
		const sites = ImpulseBlocker.getBlockedSites(),
			pattern = sites.map(item => `*://*.${item}/*`);

		// Clear blocker incase when blocker is already running
		ImpulseBlocker.clearBlocker();

		if (pattern.length > 0) {
			// Block current tabs
			ImpulseBlocker.redirectCurrent(pattern);

			// Listen to new tabs
			browser.webRequest.onBeforeRequest.addListener(
				ImpulseBlocker.redirect,
				{
					urls: pattern,
					types: ['main_frame']
				},
				['blocking']
			);
		}

		// Enable blocker auto update
		ImpulseBlocker.autoUpdateBlocker();

		// Change status to on
		ImpulseBlocker.setStatus('on');
	},

	/*
	 * Update blocker when sites array is modified
	 */
	autoUpdateBlocker: () => {
		let previousSites = JSON.stringify(ImpulseBlocker.getBlockedSites());

		ImpulseBlocker.sitesTimer = setInterval(() => {
			let currentSites = JSON.stringify(ImpulseBlocker.getBlockedSites());
			if (currentSites !== previousSites) {
				ImpulseBlocker.setBlocker();
				previousSites = currentSites;
			}
		}, ImpulseBlocker.sitesInterval);
	},

	/**
	 * Removes the web request listener and turns the extension off.
	 */
	disableBlocker: () => {
		// Restore blocked tabs
		ImpulseBlocker.restoreCurrent();

		// Remove listeners
		ImpulseBlocker.clearBlocker();
		ImpulseBlocker.setStatus('off');
	},

	/*
	 * Clear blocker listeners
	 */
	clearBlocker: () => {
		browser.webRequest.onBeforeRequest.removeListener(
			ImpulseBlocker.redirect
		);
		clearInterval(ImpulseBlocker.sitesTimer);
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
			const sites = ImpulseBlocker.getBlockedSites();
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

ImpulseBlocker.init();

// Helper functions to access object literal from popup.js file. These funcitons are
// easily accessible from the getBackgroundPage instance.
function getStatus() {
	return ImpulseBlocker.getStatus();
}

function disableBlocker() {
	ImpulseBlocker.disableBlocker();
}

function setBlocker() {
	ImpulseBlocker.setBlocker();
}

function getDomain() {
	return browser.tabs.query({
		active: true,
		currentWindow: true
	});
}

function syncUserSettings() {
	return ImpulseBlocker.syncUserSettings();
}

function getUserSettings() {
	return ImpulseBlocker.getUserSettings();
}

function refreshUserSettings() {
	return ImpulseBlocker.loadUserSettings();
}

function getBlockedSites() {
	return ImpulseBlocker.getBlockedSites();
}

function getAllSites() {
	return ImpulseBlocker.getUserSettings().blockedSites;
}

function addSite(url) {
	return ImpulseBlocker.addSite(url);
}

function removeSite(url) {
	return ImpulseBlocker.removeSite(url);
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
