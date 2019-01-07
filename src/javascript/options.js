'use strict';

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
	const browserLanguage = browser.i18n.getUILanguage(),
		getI18nMsg = browser.i18n.getMessage;

	// Set language
	document.documentElement.setAttribute('lang', browserLanguage);

	// Translate strings
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
	document.getElementById(
		'optionsBlockedSitesTHeadVisits'
	).innerText = getI18nMsg('optionsBlockedSitesTHeadVisits');
}

function restoreOptions() {
	getBackgroundPage.then(bg => {
		// Get user settings
		const userOptions = bg.getUserOptions();

		// Set sites
		setSites(userOptions.blockedSites);
	});
}

function closeOptions() {
	// Request sync sites to storage
	getBackgroundPage.then(bg => {
		bg.syncUserOptions();
	});
}

function sortSites(a, b) {
	const urlA = a.url.toLowerCase(),
		urlB = b.url.toLowerCase();

	let comparison = 0;

	if (urlA > urlB) {
		comparison = -1;
	} else if (urlA < urlB) {
		comparison = 1;
	}

	return comparison;
}

function setSites(sites) {
	// Sort alphabetically on url
	sites.sort(sortSites);



	getBackgroundPage.then(bg => {
		const history = bg.getHistory();

		// Add sites to options page
		sites.forEach(site => {
			let visits = 0;

			if (history != undefined) {
				const domainIndex = history.findIndex(v => v.url === site.url);

				if (domainIndex > -1) {
					visits = history[domainIndex].visits;
				}
			}

			addToBlockedList(site.url, visits);
		});
	});
}

function addToBlockedList(url, visits = 0) {
	const button = document.createElement('button');
	button.textContent = browser.i18n.getMessage('optionsDeleteSiteButton');

	// Insert new row
	const blockedSitesRow = blockedSites.insertRow(0);

	// Insert website cell
	const valueCell = blockedSitesRow.insertCell(0);

	// Insert visits cell
	const visitsCell = blockedSitesRow.insertCell(1);

	// Insert website cell
	const buttonCell = blockedSitesRow.insertCell(2);

	blockedSitesRow.dataset.url = url;
	valueCell.textContent = url;
	visitsCell.textContent = visits > 0 ? visits : '-';
	buttonCell.appendChild(button);
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
		const row = event.target.closest('tr');
		const url = row.dataset.url;
		row.remove();

		getBackgroundPage.then(bg => {
			bg.removeSite(url);
		});
	}
}
