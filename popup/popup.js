var toggleButton, addButton, prefsButton, removeButton, domainToAllow, domainToBlock, getBackgroundPage;

document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
    prefsButton = document.getElementById('popupPrefsButton');
    toggleButton = document.getElementById('popupToggleButton');
    addButton = document.querySelector('button.add-button');
    removeButton = document.querySelector('button.remove-button');
    domainToAllow = document.querySelector('span.domainToAllow');
    domainToBlock = document.querySelector('span.domainToBlock');
    getBackgroundPage = browser.runtime.getBackgroundPage();

    setListeners();

    localizePopup();
    restorePopup();
}

function setListeners() {
    prefsButton.addEventListener('click', openOptions);
    toggleButton.addEventListener('click', handleClick);
    addButton.addEventListener('click', addWebsite);
    removeButton.addEventListener('click', removeWebsite);
}

function localizePopup() {
    const getI18nMsg = browser.i18n.getMessage;

    prefsButton.title = getI18nMsg('popupPrefsButtonTitle');
    toggleButton.innerTex = getI18nMsg('popupToggleButtonOn');

    document.getElementById('popupHeaderName').innerText = getI18nMsg('extensionName');
    document.getElementById('popupAddButtonValue').innerText = getI18nMsg('popupAddButtonValue');
    document.getElementById('popupRemoveButtonValue').innerText = getI18nMsg('popupRemoveButtonValue');
}

function restorePopup() {
    markExtensionStatus();
    displayCurrentDomain();
}

function handleClick() {
    getBackgroundPage.then((bg) => {
        const status = bg.getStatus();
        if (status === 'on') {
            getBackgroundPage.then(bg => bg.disableBlocker());
        } else {
            getBackgroundPage.then(bg => bg.setBlocker());
        }
        markExtensionStatus();
    });
}

function markExtensionStatus() {
    getBackgroundPage.then((bg) => {
        const status = bg.getStatus();
        if (status === 'off') {
            toggleButton.classList.remove('on');
            toggleButton.classList.add('off');
            toggleButton.innerText = browser.i18n.getMessage('popupToggleButtonOff');
        } else if (status === 'on') {
            toggleButton.classList.remove('off');
            toggleButton.classList.add('on');
            toggleButton.innerText = browser.i18n.getMessage('popupToggleButtonOn');
        }
    });
}

function displayCurrentDomain() {
    getBackgroundPage.then((bg) => {
        let url;
        bg.getDomain()
            .then((tabs) => {
            url = new URL(tabs[0].url);
            // dont show the button if this is the page of the extension itself
            if (url.protocol === 'moz-extension:' || url.protocol === 'about:') return false;
            const urlToMatch = url.hostname.replace(/^www\./, '');

            domainToAllow.textContent = urlToMatch;
            domainToBlock.textContent = urlToMatch;

            const sites = bg.getSites();
            if (sites.includes(urlToMatch)) {
                    removeButton.style.display = 'block';
                    addButton.style.display = 'none';
                } else {
                    addButton.style.display = 'block';
                    removeButton.style.display = 'none';
                }
            });
    });
}

function addWebsite() {
    getBackgroundPage.then((bg) => {
        bg.addCurrentlyActiveSite().then(() => {
            restorePopup();
        });
    });
}

function removeWebsite() {
    getBackgroundPage.then((bg) => {
        bg.removeCurrentlyActiveSite().then(() => {
            restorePopup();
        });
    });
}

function openOptions() {
    browser.tabs.create({
        url: browser.extension.getURL( '/options.html' )
    });
    window.close();
}
