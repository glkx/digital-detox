const ImpulseBlocker = {
	/**
	 * Global variables
	 */
	status: 'on',
	sites: [], // used as default for storage
	sitesInterval: 500, // Interval for timer
	sitesModified: 0,
	sitesTimer: 0,
	sync: [],
	syncInterval: 15000, // Interval for timer
	syncModified: 0,
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
				// ImpulseBlocker.syncSites(storage.sites);
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
		let previousSync = ImpulseBlocker.syncModified;

		// Start interval
		setInterval(() => {
			// When previous sync timestamp is updated
			if (ImpulseBlocker.syncModified !== previousSync) {
				// Stores sites array in browser storage
				browser.storage.sync.set({
					sites: ImpulseBlocker.sync
				});
				// Update previous sync timestamp
				previousSync = ImpulseBlocker.syncModified;
			}
		}, ImpulseBlocker.syncInterval);
	},

	/*
	 * Set new sites array to sync
	 */
	syncSites: sites => {
		// When sites are defined
		if (sites !== undefined) {
			// Set global sync array
			ImpulseBlocker.sync = sites;
			ImpulseBlocker.syncModified = Date.now();
		}
	},

	/**
	 * Returns the current loaded sites of the extension.
	 */
	getSites: () => ImpulseBlocker.sites,

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
	 * Add a website to the blocked list
	 * @param  {string} url Url to add to the list
	 */
	addSite: url => {
		const sites = ImpulseBlocker.getSites();
		sites.push(url);
		ImpulseBlocker.setSites(sites);
		ImpulseBlocker.syncSites(sites);
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
		ImpulseBlocker.syncSites(sites);
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
	 * Redirects the tab to local "You have been blocked" page.
	 */
	redirect: requestDetails => {
		browser.tabs.update(requestDetails.tabId, {
			url: browser.extension.getURL(
				'/redirect.html?from=' + requestDetails.url
			)
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
