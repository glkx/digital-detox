var blockedSites, form, getBackgroundPage;

document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
	blockedSites = document
		.getElementById('optionsBlockedSites')
		.getElementsByTagName('tbody')[0];
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
	document.getElementById(
		'optionsBlockedSitesTHeadWebsites'
	).innerText = getI18nMsg('optionsBlockedSitesTHeadWebsites');
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

function addToBlockedList(url) {
	const button = document.createElement('button');
	button.textContent = browser.i18n.getMessage('optionsDeleteSiteButton');

	// Insert new row
	const blockedSitesRow = blockedSites.insertRow(0);

	// Insert website cell
	const valueCell = blockedSitesRow.insertCell(0);

	// Insert website cell
	const buttonCell = blockedSitesRow.insertCell(1);

	blockedSitesRow.dataset.url = url;
	valueCell.textContent = url;
	buttonCell.appendChild(button);
}

function hasNoProtocol(url) {
	const regex = /^[a-zA-Z]{3,}:\/\//;
	return !regex.test(url);
}

function hasNoExtension(url) {
	const regex = /(\w+\.\w+)$/;
	return !regex.test(url);
}

function saveSite(event) {
	event.preventDefault();
	const url = form.site.value;
	if (url.length === 0) {
		return;
	}

	// Add url to list
	addToBlockedList(url);

	// Clear form field
	form.site.value = '';

	// Store url
	getBackgroundPage.then(bg => {
		bg.addSite(url);
	});
}

function deleteSite(event) {
	if (event.target.nodeName === 'BUTTON') {
		const deleteRow = event.target.closest('tr');
		const deleteWebsite = deleteRow.dataset.url;
		deleteRow.remove();

		getBackgroundPage.then(bg => {
			bg.removeSite(deleteWebsite);
		});
	}
}
