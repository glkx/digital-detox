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
                ImpulseBlocker.loadSites( storage );
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
            url: '/redirect.html?from=' + requestDetails.url
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
            var icon = 'icons/icon-96.svg';
        } else {
            var icon = 'icons/icon-96-disabled.svg';
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
        ImpulseBlocker.sites = storage.sites;
    },
    reloadSites: () => {
        browser.storage.sync.get('sites').then((storage) => {
            ImpulseBlocker.sites = storage.sites;
        });
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
        handleSites.then(ImpulseBlocker.reloadSites);
    },

    /**
     * Add a website to the blocked list
     * @param  {string} url Url to remove to the list
     */
    removeSite: (url) => {
        const sites = ImpulseBlocker.getSites();
        const i = sites.indexOf(url);
        if (i !== -1) {
            storage.sites.splice(i, 1);
        }
        browser.storage.sync.set({
            'sites': sites,
        });
        handleSites.then(ImpulseBlocker.reloadSites);
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
    return browser.storage.sync.get('sites');
}

function addCurrentlyActiveSite() {
    const gettingActiveTab = browser.tabs.query({
        active: true,
        currentWindow: true
    });
    return gettingActiveTab.then((tabs) => {
        const url = new URL(tabs[0].url);
        ImpulseBlocker.addSite(url.hostname.replace(/^www\./, ''));
    });
}

function removeCurrentlyActiveSite() {
    const gettingActiveTab = browser.tabs.query({
        active: true,
        currentWindow: true
    });
    return gettingActiveTab.then((tabs) => {
        const url = new URL(tabs[0].url);
        ImpulseBlocker.removeSite(url.hostname.replace(/^www\./, ''));
    });
}
