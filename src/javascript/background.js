const ImpulseBlocker = {
	/**
	 * Global variables
	 */
	status: 'on',
	sites: [
		'facebook.com',
		'youtube.com',
		'tumblr.com',
		'instagram.com',
		'twitter.com',
		'snapchat.com',
		'vk.com',
		'pinterest.com',
		'reddit.com',
		'linkedin.com',
		'9gag.com',
		'dumpert.nl',
		'dailymotion.com'
	], // used as default for storage
	sitesInterval: 500, // Interval for timer
	sitesModified: 0,
	sitesTimer: 0,
	syncInterval: 15000, // Interval for timer
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
		ImpulseBlocker.loadSites().then(() => {
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
		var icon = browser.extension.getURL('/icons/icon-96.svg');

		// When status is off
		if (status === 'off') {
			icon = browser.extension.getURL('/icons/icon-96-disabled.svg');

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
	 * Load sites from storage
	 */
	loadSites: () => {
		return browser.storage.sync.get('sites').then(storage => {
			if (typeof storage.sites !== undefined) {
				ImpulseBlocker.setSites(storage.sites);
			} else {
				ImpulseBlocker.prepareSites();
			}
		});
	},

	/**
	 * Prepare new sites storage
	 */
	prepareSites: () => {
		browser.storage.sync.set({
			sites: ImpulseBlocker.sites
		});
	},

	/**
	 * Listen for new sites array to sync to browser storage
	 */
	syncListener: () => {
		// Get previous sync timestamp
		let previousSync = ImpulseBlocker.sitesModified;

		// Start interval
		setInterval(() => {
			// When previous sync timestamp is updated
			if (ImpulseBlocker.sitesModified !== previousSync) {
				// Stores sites array in browser storage
				ImpulseBlocker.syncSites();

				// Update previous sync timestamp
				previousSync = ImpulseBlocker.sitesModified;
			}
		}, ImpulseBlocker.syncInterval);
	},

	syncSites: () => {
		// Stores sites array in browser storage
		browser.storage.sync.set({
			sites: ImpulseBlocker.sites
		});
	},

	/**
	 * Set sites from storage
	 */
	setSites: sites => {
		// When sites are defined
		if (sites !== undefined) {
			// Set global sites array
			ImpulseBlocker.sites = sites;
			ImpulseBlocker.sitesModified = Date.now();
		}
	},

	/**
	 * Returns the current loaded sites of the extension.
	 */
	getSites: () => ImpulseBlocker.sites,

	/**
	 * Add a website to the blocked list
	 * @param  {string} url Url to add to the list
	 */
	addSite: url => {
		const sites = ImpulseBlocker.getSites();
		sites.push(url);
		ImpulseBlocker.setSites(sites);
	},

	/**
	 * Add a website to the blocked list
	 * @param  {string} url Url to remove to the list
	 */
	removeSite: url => {
		const sites = ImpulseBlocker.getSites();
		const i = sites.indexOf(url);
		if (i !== -1) {
			sites.splice(i, 1);
		}
		ImpulseBlocker.setSites(sites);
	},

	/**
	 * Fetches blocked websites lists, attaches them to the listener provided by the WebExtensions API
	 */
	setBlocker: () => {
		const sites = ImpulseBlocker.getSites(),
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
					types: ['main_frame', 'sub_frame']
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
		let previousSites = ImpulseBlocker.sitesModified;
		ImpulseBlocker.sitesTimer = setInterval(() => {
			if (ImpulseBlocker.sitesModified !== previousSites) {
				ImpulseBlocker.setBlocker();
				previousSites = ImpulseBlocker.sitesModified;
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
						url: browser.extension.getURL(
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
		// Catch url that are false positive for example when a url has a url as component
		const sites = ImpulseBlocker.getSites();
		const matchUrl = new URL(requestDetails.url);
		const matchDomain = matchUrl.hostname.replace(/^www\./, '');

		if (sites.includes(matchDomain)) {
			browser.tabs.update(requestDetails.tabId, {
				url: browser.extension.getURL(
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
				url: browser.extension.getURL('*')
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

function syncSites() {
	return ImpulseBlocker.syncSites();
}

function refreshSites() {
	return ImpulseBlocker.loadSites();
}

function getSites() {
	return ImpulseBlocker.getSites();
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
