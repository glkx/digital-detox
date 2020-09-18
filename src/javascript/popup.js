'use strict';

// Variables
import runtimeMessage from './variables/runtimeMessages';

let toggleButton,
	toggleButtonDelay = 5000,
	toggleButtonTimer,
	addButton,
	prefsButton,
	removeButton,
	domainToAllow,
	domainToBlock;

document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
	toggleButton = document.getElementById('popupToggleButton');
	prefsButton = document.getElementById('popupPrefsButton');
	addButton = document.querySelector('button.add-button');
	removeButton = document.querySelector('button.remove-button');
	domainToAllow = document.querySelector('span.domainToAllow');
	domainToBlock = document.querySelector('span.domainToBlock');

	setListeners();

	localizePopup();
	restorePopup();
}

function setListeners() {
	toggleButton.addEventListener('click', toggleBlocker);
	toggleButton.addEventListener('mousedown', startLongPress);
	toggleButton.addEventListener('mouseup', stopLongPress);
	toggleButton.addEventListener('mouseout', stopLongPress);
	prefsButton.addEventListener('click', openOptions);
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

async function toggleBlocker() {
	const status = await browser.runtime.sendMessage({
		type: runtimeMessage.getStatus
	});

	if (status === 'on') {
		// Cancel click event when delay is set.
		if (null !== toggleButtonDelay && toggleButtonDelay > 0) {
			console.log('Cancel toggle blocker.');
			return;
		}

		browser.runtime.sendMessage({
			type: runtimeMessage.disableBlocker
		});
	} else {
		browser.runtime.sendMessage({
			type: runtimeMessage.enableBlocker
		});
	}

	setStatus();
}

async function startLongPress() {
	// Get blocker status.
	const status = await browser.runtime.sendMessage({
		type: runtimeMessage.getStatus
	});

	console.log(status);

	// When blocker is enabled start delay timer.
	if ('on' === status) {
		console.log('Start toggle button timer.');

		// Add timer class.
		toggleButton.classList.add('has-delay-timer');

		// Start delay timer.
		toggleButtonTimer = setTimeout(function() {
			console.log('Long press completed.');

			// Disable blocker.
			browser.runtime.sendMessage({
				type: runtimeMessage.disableBlocker
			});
		}, toggleButtonDelay);
	}
}

async function stopLongPress() {
	// Remove delay timer class.
	if (toggleButton.classList.contains('has-delay-timer')) {
		toggleButton.classList.remove('has-delay-timer');
	}

	// Stop and cleanup delay timer.
	if (null !== toggleButtonTimer) {
		console.log('Cancel toggle button timer.');
		clearTimeout(toggleButtonTimer);
		toggleButtonTimer = null;
	}
}

async function setStatus() {
	const status = await browser.runtime.sendMessage({
		type: runtimeMessage.getStatus
	});

	if (status === 'off') {
		if (toggleButton.classList.contains('on')) {
			toggleButton.classList.remove('on');
		}
		toggleButton.classList.add('off');
		/* toggleButton.innerText = browser.i18n.getMessage(
			'popupToggleButtonOff'
		); */
	} else if (status === 'on') {
		if (toggleButton.classList.contains('off')) {
			toggleButton.classList.remove('off');
		}
		toggleButton.classList.add('on');
		// toggleButton.innerText = browser.i18n.getMessage('popupToggleButtonOn');
	}
}

async function setCurrentDomain() {
	const domain = await browser.runtime.sendMessage({
		type: runtimeMessage.getCurrentDomain
	});

	if (domain !== false) {
		const sites = await browser.runtime.sendMessage({
			type: runtimeMessage.getAllSites
		});

		domainToAllow.textContent = '(' + domain + ')';
		domainToBlock.textContent = '(' + domain + ')';

		if (sites.findIndex(v => v.url === domain) > -1) {
			removeButton.style.display = 'block';
			addButton.style.display = 'none';
		} else {
			addButton.style.display = 'block';
			removeButton.style.display = 'none';
		}
	}
}

async function addWebsite() {
	const domain = await browser.runtime.sendMessage({
		type: runtimeMessage.getCurrentDomain
	});

	await browser.runtime.sendMessage({
		type: runtimeMessage.addSite,
		url: domain
	});

	restorePopup();
}

async function removeWebsite() {
	const domain = await browser.runtime.sendMessage({
		type: runtimeMessage.getCurrentDomain
	});

	await browser.runtime.sendMessage({
		type: runtimeMessage.removeSite,
		url: domain
	});

	restorePopup();
}

function openOptions() {
	browser.tabs.create({
		url: browser.runtime.getURL('/options.html')
	});
	window.close();
}
