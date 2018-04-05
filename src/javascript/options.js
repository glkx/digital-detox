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
	window.addEventListener('beforeunload', closeOptions);
	form.addEventListener('submit', saveSite);
	blockedSites.addEventListener('click', deleteSite);
}

function localizeOptions() {
	const getI18nMsg = browser.i18n.getMessage;
	document.getElementById('optionsTitle').innerText = getI18nMsg(
		'optionsTitle'
	);
	document.getElementById('optionHeaderName').innerText = getI18nMsg(
		'extensionName'
	);
	document.getElementById('optionsAddSiteLabel').innerText = getI18nMsg(
		'optionsAddSiteLabel'
	);
	document.getElementById('optionsAddSiteInput').placeholder = getI18nMsg(
		'optionsAddSiteInputPlaceholder'
	);
	document.getElementById('optionsAddSiteButton').innerText = getI18nMsg(
		'optionsAddSiteButton'
	);
}

function restoreOptions() {
	browser.storage.local.get('options_setup').then(storage => {
		if (storage.options_setup !== true) {
			getBackgroundPage.then(bg => {
				// Rehresh sites
				bg.refreshSites().then(setSites);
			});
			browser.storage.local.set({
				options_setup: true
			});
		} else {
			setSites();
		}
	});
}

function setSites() {
	getBackgroundPage.then(bg => {
		// Get sites
		const sites = bg.getSites();

		// Sort alphabetically A - Z
		sites.sort();
		sites.reverse();

		// Add sites to options page
		sites.forEach(site => {
			addToBlockedList(site);
		});
	});
}

function closeOptions() {
	// Request sync sites to storage
	getBackgroundPage.then(bg => {
		bg.syncSites();
	});
}

function addToBlockedList(text) {
	const button = document.createElement('button');
	button.textContent = browser.i18n.getMessage('optionsDeleteSiteButton');

	const listItem = document.createElement('li');
	listItem.textContent = text;
	listItem.appendChild(button);

	blockedSites.insertBefore(listItem, blockedSites.childNodes[0]);
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
	if (url.hostname != '.com') {
		addToBlockedList(url.hostname);
		form.site.value = '';

		getBackgroundPage.then(bg => {
			bg.addSite(url.hostname);
		});
	}
}

function deleteSite(event) {
	if (event.target.nodeName === 'BUTTON') {
		const toDelete = event.target.parentElement;
		const toDeleteParent = toDelete.parentElement;
		const toDeleteText = event.target.previousSibling.textContent;
		toDeleteParent.removeChild(toDelete);

		getBackgroundPage.then(bg => {
			bg.removeSite(toDeleteText);
		});
	}
}
