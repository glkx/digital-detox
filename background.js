const ImpulseBlocker = {

    /**
     * Global variables
     */
    status: 'on',
    sites: [], // used as default for storage

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
                ImpulseBlocker.loadSites(storage);
            } else {
                ImpulseBlocker.prepareSites();
            }
        });

        handlingSites.then(ImpulseBlocker.setBlocker, ImpulseBlocker.onError);
    },

    prepareStorage: () => {

    },

    /**
     * Redirects the tab to local "You have been blocked" page.
     */
    redirect: (requestDetails) => {
        browser.tabs.update(requestDetails.tabId, {
            url: browser.extension.getURL( '/redirect.html?from=' + requestDetails.url )
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
            var icon = browser.extension.getURL( '/icons/icon-96.svg' );
        } else {
            var icon = browser.extension.getURL( '/icons/icon-96-disabled.svg' );
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
        if (pattern.length > 0) {
            browser.webRequest.onBeforeRequest.addListener(
                ImpulseBlocker.redirect, {
                    urls: pattern,
                    types: ['main_frame']
                }, ['blocking'],
            );
        }

        browser.storage.onChanged.addListener(() => {
            // if the extension off we should not be bothered by restarting with new list
            if (ImpulseBlocker.getStatus() === 'on') {
                ImpulseBlocker.setBlocker();
            }
        });

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
    loadSites: (storage) => {
        if (storage === 'undefined') {
            browser.storage.sync.get('sites').then((storage) => {
                ImpulseBlocker.sites = storage.sites;
            });
        } else {
            ImpulseBlocker.sites = storage.sites;
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
        const handleSites = browser.storage.sync.set({
            'sites': sites,
        });
        handleSites.then(ImpulseBlocker.loadSites({
            'sites': sites,
        }));
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
        const handleSites = browser.storage.sync.set({
            'sites': sites,
        });
        handleSites.then(ImpulseBlocker.loadSites({
            'sites': sites,
        }));
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
