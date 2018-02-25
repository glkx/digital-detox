var blockedSites, form, getBackgroundPage;

document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
    blockedSites = document.querySelector('ul.blocked-sites');
    form = document.querySelector('form');
    getBackgroundPage = browser.runtime.getBackgroundPage();

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
    document.getElementById('optionsTitle').innerText = getI18nMsg('optionsTitle');
    document.getElementById('optionHeaderName').innerText = getI18nMsg('extensionName');
    document.getElementById('optionsAddSiteLabel').innerText = getI18nMsg('optionsAddSiteLabel');
    document.getElementById('optionsAddSiteInput').placeholder = getI18nMsg('optionsAddSiteInputPlaceholder');
    document.getElementById('optionsAddSiteButton').innerText = getI18nMsg('optionsAddSiteButton');
}

function restoreOptions() {
    getBackgroundPage.then((bg) => {
        const sites = bg.getSites();
        sites.sort();
        sites.forEach((site) => {
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

    getBackgroundPage.then((bg) => {
        bg.addSite(url.hostname);
    });
}

function deleteSite(event) {
    if (event.target.nodeName === 'BUTTON') {
        const toDelete = event.target.parentElement;
        const toDeleteParent = toDelete.parentElement;
        const toDeleteText = event.target.previousSibling.textContent;
        toDeleteParent.removeChild(toDelete);

        getBackgroundPage.then((bg) => {
            bg.removeSite(toDeleteText);
        });
    }
}
