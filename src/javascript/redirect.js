'use strict';

var getBackgroundPage, currentUrl, redirectUrl, redirectDomain;

document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
	getBackgroundPage = browser.runtime.getBackgroundPage();

	// Get domain
	currentUrl = new URL(window.location.href);
	redirectUrl = atob(
		decodeURIComponent(currentUrl.searchParams.get('from'))
	);
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
			'redirectShortCustomDescText', redirectDomain
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
				redirectUrl !== 'undefined' &&
				(status === 'off' ||
					sites.findIndex(v => v.url === redirectDomain) === -1)
			) {
				window.location.href = redirectUrl;
			}
		});
	}
}
