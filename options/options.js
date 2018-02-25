var blockedSites, form, getSites;

document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
    blockedSites = document.querySelector('ul.blocked-sites');
    form = document.querySelector('form');
    getSites = browser.storage.sync.get('sites');

    setListeners();

    localizeOptions();
    restoreOptions();
}

function setListeners() {
    form.addEventListener('submit', saveSite);
    blockedSites.addEventListener('click', deleteSite);
}

function localizeOptions() {
    const getI18nMsg = browser.i18n.getMessage;
    document.getElementById('header-name').innerText = getI18nMsg('extensionName');
    document.getElementById('add-site-label').innerText = getI18nMsg('optionsAddSiteLabel');
    document.getElementById('add-site-input').placeholder = getI18nMsg('optionsAddSiteInputPlaceholder');
    document.getElementById('add-site-button').innerText = getI18nMsg('optionsAddSiteButton');
}

function restoreOptions() {
    getSites.then((storage) => {
        storage.sites.forEach((site) => {
            addToBlockedList(site);
        });
    });
}

function addToBlockedList(text) {
    const button = document.createElement('button');
    button.textContent = browser.i18n.getMessage('optionsDeleteSiteButton');

    const listItem = document.createElement('li');
    listItem.textContent = text;
    listItem.appendChild(button);

    blockedSites.appendChild(listItem);
}

function hasNoProtocol(url) {
    const regex = /^[a-zA-Z]{3,}:\/\//;
    return !regex.test(url);
}

function hasNoExtension(url) {
    const regex = /(\w+\.\w+)$/;
    return !regex.test(url);
}

function normalizeUrl(url) {
    let urlToAdd = url.replace(/^www\./, '');

    if (hasNoProtocol(urlToAdd)) {
        urlToAdd = `http://${urlToAdd}`;
    }

    if (hasNoExtension(urlToAdd)) {
        urlToAdd += '.com';
    }

    return new URL(urlToAdd);
}

function saveSite(event) {
    event.preventDefault();
    const url = normalizeUrl(form.site.value);
    addToBlockedList(url.hostname);
    form.site.value = '';

    getSites.then((storage) => {
        storage.sites.push(url.hostname);
        browser.storage.sync.set({
            'sites': storage.sites,
        });
    });
}

function deleteSite(event) {
    if (event.target.nodeName === 'BUTTON') {
        const toDelete = event.target.parentElement;
        const toDeleteParent = toDelete.parentElement;
        const toDeleteText = event.target.previousSibling.textContent;
        toDeleteParent.removeChild(toDelete);

        getSites.then((storage) => {
            const i = storage.sites.indexOf(toDeleteText);
            if (i !== -1) {
                storage.sites.splice(i, 1);
            }
            browser.storage.sync.set({
                'sites': storage.sites,
            });
        });
    }
}
