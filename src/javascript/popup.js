'use strict';

let toggleButton,
	addButton,
	prefsButton,
	removeButton,
	domainToAllow,
	domainToBlock,
	getBackgroundPage;

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
	const browserLanguage = browser.i18n.getUILanguage(),
		getI18nMsg = browser.i18n.getMessage;

	// Set language
	document.documentElement.setAttribute('lang', browserLanguage);

	// Translate strings
	document.querySelectorAll('[i18n]').forEach(element => {
		const translation = getI18nMsg(element.getAttribute('i18n'));

		if (translation != undefined) {
			element.innerText = translation;
		}
	});

	// Translate attributes
	prefsButton.title = getI18nMsg('popupPrefsButtonTitle');
}

function restorePopup() {
	setStatus();
	setCurrentDomain();
}

function handleClick() {
	getBackgroundPage.then(bg => {
		const status = bg.getStatus();
		if (status === 'on') {
			getBackgroundPage.then(bg => bg.disableBlocker());
		} else {
			getBackgroundPage.then(bg => bg.enableBlocker());
		}
		setStatus();
	});
}

function setStatus() {
	getBackgroundPage.then(bg => {
		const status = bg.getStatus();
		if (status === 'off') {
			if (toggleButton.classList.contains('on')) {
				toggleButton.classList.remove('on');
			}
			toggleButton.classList.add('off');
			toggleButton.innerText = browser.i18n.getMessage(
				'popupToggleButtonOff'
			);
		} else if (status === 'on') {
			if (toggleButton.classList.contains('off')) {
				toggleButton.classList.remove('off');
			}
			toggleButton.classList.add('on');
			toggleButton.innerText = browser.i18n.getMessage(
				'popupToggleButtonOn'
			);
		}
	});
}

function setCurrentDomain() {
	getBackgroundPage.then(bg => {
		bg.getDomain().then(tabs => {
			let url = new URL(tabs[0].url);
			// dont show the button for non-http pages
			if (['http:', 'https:'].indexOf(url.protocol) == -1) {
				return false;
			}
			const urlToMatch = url.hostname.replace(/^www\./, '');

			domainToAllow.textContent = '(' + urlToMatch + ')';
			domainToBlock.textContent = '(' + urlToMatch + ')';

			const sites = bg.getAllSites();

			if (sites.findIndex(v => v.url === urlToMatch) > -1) {
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
	getBackgroundPage.then(bg => {
		bg.addCurrentlyActiveSite().then(() => {
			restorePopup();
		});
	});
}

function removeWebsite() {
	getBackgroundPage.then(bg => {
		bg.removeCurrentlyActiveSite().then(() => {
			restorePopup();
		});
	});
}

function openOptions() {
	browser.tabs.create({
		url: browser.runtime.getURL('/options.html')
	});
	window.close();
}
