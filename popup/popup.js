const toggleButton = document.querySelector('button.toggle-button');
const addButton = document.querySelector('button.add-button');
const optionsButton = document.querySelector('button.prefs-button');
const removeButton = document.querySelector('button.remove-button');
const domainToAllow = document.querySelector('span.domainToAllow');
const domainToBlock = document.querySelector('span.domainToBlock');
const getBackgroundPage = browser.runtime.getBackgroundPage();

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
            toggleButton.innerHTML = 'Continue';
        } else if (status === 'on') {
            toggleButton.classList.remove('off');
            toggleButton.classList.add('on');
            toggleButton.innerHTML = 'Pause';
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

                bg.getSites().then((storage) => {
                    if (storage.sites.includes(urlToMatch)) {
                        removeButton.style.display = 'block';
                        addButton.style.display = 'none';
                    } else {
                        addButton.style.display = 'block';
                        removeButton.style.display = 'none';
                    }
                });
            });
    });
}

function refreshToolbar() {
    markExtensionStatus();
    displayCurrentDomain();
}

function addWebsite() {
    getBackgroundPage.then((bg) => {
        bg.addCurrentlyActiveSite().then(() => {
            refreshToolbar();
        });
    });
}

function removeWebsite() {
    getBackgroundPage.then((bg) => {
        bg.removeCurrentlyActiveSite().then(() => {
            refreshToolbar();
        });
    });
}

function openOptions() {
    browser.tabs.create({
        url: "/options.html"
    });
    window.close();
}

toggleButton.addEventListener('click', handleClick);
addButton.addEventListener('click', addWebsite);
removeButton.addEventListener('click', removeWebsite);
optionsButton.addEventListener('click', openOptions);

refreshToolbar();
