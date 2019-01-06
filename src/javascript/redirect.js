'use strict';

var getBackgroundPage, currentUrl, redirectUrl, redirectDomain;

document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
	getBackgroundPage = browser.runtime.getBackgroundPage();

	// Get domain
	currentUrl = new URL(window.location.href);
	redirectUrl = atob(decodeURIComponent(currentUrl.searchParams.get('from')));
	redirectDomain = new URL(redirectUrl).hostname.replace(/^www\./, '');

	restoreRedirect();
	localizeRedirect();
}

function localizeRedirect() {
	const browserLanguage = browser.i18n.getUILanguage(),
		getI18nMsg = browser.i18n.getMessage;

	// Set language
	document.documentElement.setAttribute('lang', browserLanguage);

	// Translate strings
	document.getElementById('redirectTitle').innerText = getI18nMsg(
		'redirectTitle'
	);
	document.getElementById('redirectTitleText').innerText = getI18nMsg(
		'redirectTitle'
	);

	if (redirectDomain !== 'undefined') {
		document.getElementById('redirectShortDescText').innerText = getI18nMsg(
			'redirectShortCustomDescText',
			redirectDomain
		);
	} else {
		document.getElementById('redirectShortDescText').innerText = getI18nMsg(
			'redirectShortDescText'
		);
	}
}

function restoreRedirect() {
	if (window.performance.navigation.type == 2) {
		window.history.back();
	} else {
		getBackgroundPage.then(bg => {
			const status = bg.getStatus(),
				sites = bg.getAllSites();

			if (
				redirectUrl != undefined &&
				(status == 'off' || matchUrl(redirectDomain, sites) === false)
			) {
				window.location.href = redirectUrl;
			}
		});
	}
}

function matchUrl(url, list) {
	if (list.findIndex(v => v.url === url) > -1) {
		return true;
	} else {
		for (let i = 0; i < list.length; i++) {
			if (url.match(list[i])) {
				return true;
			}
		}
	}
	return false;
}
