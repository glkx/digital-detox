const ImpulseBlocker = {

    /**
     * Global variables
     */
    status: 'on',
    sites: ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com'], // used as default for storage
    sitesChange: 0,
    sitesTiming: 500,
    sitesInterval: 0,
    sync: [],
    syncChange: 0,
    syncTiming: 10000,
    syncInterval: 0,

    /**
     * Generic error logger.
     */
    onError: (event) => {
        console.error(event);
    },

    /**
     * Starts the blocker. Adds a listener so that if new websites is added
     * to the blocked list the listener is refreshed.
     */
    init: () => {
        const handlingSites = browser.storage.sync.get('sites').then((storage) => {
            if (typeof storage.sites !== 'undefined') {
                ImpulseBlocker.setSites(storage.sites);
                ImpulseBlocker.syncSites(storage.sites);
            } else {
                ImpulseBlocker.prepareSites();
            }
        });

        handlingSites.then(ImpulseBlocker.setBlocker, ImpulseBlocker.onError);

        // Listerner for sites to sync
        let lastSync = ImpulseBlocker.syncChange;
        ImpulseBlocker.syncInterval = setInterval(() => {
            if (ImpulseBlocker.syncChange !== lastSync) {
                lastSync = ImpulseBlocker.syncChange;
                console.log('Sync!');
                browser.storage.sync.set({
                    'sites': ImpulseBlocker.sync
                });
            }
        }, ImpulseBlocker.syncTiming);

    },

    /**
     * Redirects the tab to local "You have been blocked" page.
     */
    redirect: (requestDetails) => {
        browser.tabs.update(requestDetails.tabId, {
            url: browser.extension.getURL('/redirect.html?from=' + requestDetails.url)
        });
    },

    /**
     * Returns the current status of the extension.
     */
    getStatus: () => ImpulseBlocker.status,

    /**
     * Sets the current status of the extension.
     * @param string status
     */
    setStatus: (status) => {
        ImpulseBlocker.status = status;
        if (status === 'on') {
            let icon = browser.extension.getURL('/icons/icon-96.svg');
        } else {
            let icon = browser.extension.getURL('/icons/icon-96-disabled.svg');
        }
        browser.browserAction.setIcon({
            path: icon
        });
    },

    /**
     * Fetches blocked websites lists, attaches them to the listener provided
     * by the WebExtensions API.
     */
    setBlocker: () => {
        const sites = ImpulseBlocker.getSites();
        const pattern = sites.map(item => `*://*.${item}/*`);

        browser.webRequest.onBeforeRequest.removeListener(ImpulseBlocker.redirect);
        clearInterval(ImpulseBlocker.sitesInterval);

        if (pattern.length > 0) {
            browser.webRequest.onBeforeRequest.addListener(
                ImpulseBlocker.redirect, {
                    urls: pattern,
                    types: ['main_frame']
                }, ['blocking'],
            );
        }

        let lastSites = ImpulseBlocker.sitesChange;
        ImpulseBlocker.sitesInterval = setInterval(() => {
            if (ImpulseBlocker.sitesChange !== lastSites) {
                lastSites = ImpulseBlocker.sitesChange;
                if (ImpulseBlocker.getStatus() === 'on') {
                    ImpulseBlocker.setBlocker();
                }
            }
        }, ImpulseBlocker.sitesTiming);

        ImpulseBlocker.setStatus('on');
    },

    /**
     * Removes the web request listener and turns the extension off.
     */
    disableBlocker: () => {
        browser.webRequest.onBeforeRequest.removeListener(ImpulseBlocker.redirect);
        ImpulseBlocker.setStatus('off');
    },

    /**
     * Load sites from storage
     */
    prepareSites: () => {
        browser.storage.sync.set({
            'sites': ImpulseBlocker.sites,
        });
    },

    /**
     * (Re)Load sites from storage
     */
    syncSites: (sites) => {
        if (sites !== 'undefined') {
            ImpulseBlocker.sync = sites;
            ImpulseBlocker.syncChange = Date.now();
        }
    },

    /**
     * Set sites from storage
     */
    setSites: (sites) => {
        if (sites !== 'undefined') {
            ImpulseBlocker.sites = sites;
            ImpulseBlocker.sitesChange = Date.now();
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
    addSite: (url) => {
        const sites = ImpulseBlocker.getSites();
        sites.push(url);
        ImpulseBlocker.setSites(sites);
        ImpulseBlocker.syncSites(sites);
    },

    /**
     * Add a website to the blocked list
     * @param  {string} url Url to remove to the list
     */
    removeSite: (url) => {
        const sites = ImpulseBlocker.getSites();
        const i = sites.indexOf(url);
        if (i !== -1) {
            sites.splice(i, 1);
        }
        ImpulseBlocker.setSites(sites);
        ImpulseBlocker.syncSites(sites);
    },
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
    const gettingActiveTab = browser.tabs.query({
        active: true,
        currentWindow: true
    });
    return gettingActiveTab.then((tabs) => {
        const url = new URL(tabs[0].url);
        addSite(url.hostname.replace(/^www\./, ''));
    });
}

function removeCurrentlyActiveSite() {
    const gettingActiveTab = browser.tabs.query({
        active: true,
        currentWindow: true
    });
    return gettingActiveTab.then((tabs) => {
        const url = new URL(tabs[0].url);
        removeSite(url.hostname.replace(/^www\./, ''));
    });
}
