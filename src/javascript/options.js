'use strict';

// Variables
import runtimeMessage from './variables/runtimeMessages.mjs';

let blockedSites, formBlockSite;

document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
	blockedSites = document
		.getElementById('optionsBlockedSites')
		.getElementsByTagName('tbody')[0];
	formBlockSite = document.getElementById('formBlockSite');

	setListeners();

	localizeOptions();
	restoreOptions();
}

function setListeners() {
	window.addEventListener('beforeunload', closeOptions);
	formBlockSite.addEventListener('submit', saveSite);
	blockedSites.addEventListener('click', deleteSite);
}

function localizeOptions() {
	const browserLanguage = browser.i18n.getUILanguage(),
		getI18nMsg = browser.i18n.getMessage;

	// Set language
	document.documentElement.setAttribute('lang', browserLanguage);

	// Translate strings
	document.querySelectorAll('[i18n]').forEach((element) => {
		const translation = getI18nMsg(element.getAttribute('i18n'));

		if (translation != undefined) {
			element.innerText = translation;
		}
	});

	// Translate attributes
	document.getElementById('optionsAddSiteInput').placeholder = getI18nMsg(
		'optionsAddSiteInputPlaceholder'
	);
	document.getElementById('optionsBlockedSitesTHeadVisits').dataset.tooltip =
		getI18nMsg('optionsBlockedSitesTHeadVisits');
	document.getElementById('optionsBlockedSitesTHeadBlocks').dataset.tooltip =
		getI18nMsg('optionsBlockedSitesTHeadBlocks');
}

async function restoreOptions() {
	const userOptions = await browser.runtime.sendMessage({
		type: runtimeMessage.getUserOptions,
	});

	// Set sites
	setSites(userOptions.blockedSites);
}

function closeOptions() {
	// Request sync sites to storage
	browser.runtime.sendMessage({
		type: runtimeMessage.syncUserOptions,
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

async function setSites(sites) {
	// Sort alphabetically on url
	sites.sort(sortSites);

	const history = await browser.runtime.sendMessage({
		type: runtimeMessage.getHistory,
	});

	// Add sites to options page
	sites.forEach((site) => {
		let visits = 0,
			blocks = 0;

		if (history != undefined) {
			const domainIndex = history.findIndex((v) => v.url === site.url);

			if (domainIndex > -1) {
				visits = history[domainIndex].visits;
				blocks = history[domainIndex].blocks;
			}
		}

		addToBlockedList(site.url, visits, blocks);
	});
}

function addToBlockedList(url, visits = 0, blocks = 0) {
	const button = document.createElement('button');
	button.title = browser.i18n.getMessage('optionsDeleteSiteButton');

	// Insert new row
	const blockedSitesRow = blockedSites.insertRow(0);

	// Insert website cell
	const valueCell = blockedSitesRow.insertCell(0);

	// Insert visits cell
	const visitsCell = blockedSitesRow.insertCell(1);

	// Insert blocked visits cell
	const blocksCell = blockedSitesRow.insertCell(2);

	// Insert website cell
	const buttonCell = blockedSitesRow.insertCell(3);

	blockedSitesRow.dataset.url = url;
	valueCell.textContent = url;
	visitsCell.textContent = visits > 0 ? visits : '-';
	blocksCell.textContent = blocks > 0 ? blocks : '-';
	buttonCell.appendChild(button);
}

function saveSite(event) {
	event.preventDefault();
	const url = formBlockSite.site.value;
	if (url.length === 0) {
		return;
	}

	// Add url to list
	addToBlockedList(url);

	// Clear form field
	formBlockSite.site.value = '';

	// Store url
	browser.runtime.sendMessage({
		type: runtimeMessage.addSite,
		url: url,
		time: 0,
	});
}

function deleteSite(event) {
	if (event.target.nodeName === 'BUTTON') {
		const row = event.target.closest('tr');
		const url = row.dataset.url;
		row.remove();

		browser.runtime.sendMessage({
			type: runtimeMessage.removeSite,
			url: url,
		});
	}
}
