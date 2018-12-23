var getBackgroundPage;

document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
	getBackgroundPage = browser.runtime.getBackgroundPage();

	restoreRedirect();
	localizeRedirect();
}

function localizeRedirect() {
	const getI18nMsg = browser.i18n.getMessage;
	document.getElementById('redirectTitle').innerText = getI18nMsg(
		'redirectTitle'
	);
	document.getElementById('redirectTitleText').innerText = getI18nMsg(
		'redirectTitle'
	);
	document.getElementById('redirectShortDescText').innerText = getI18nMsg(
		'redirectShortDescText'
	);
}

function restoreRedirect() {
	if (window.performance.navigation.type == 2) {
		window.history.back();
	} else {
		getBackgroundPage.then(bg => {
			const status = bg.getStatus();
			const sites = bg.getSites();
			const currentUrl = new URL(window.location.href);
			const redirectUrl = atob(
				decodeURIComponent(currentUrl.searchParams.get('from'))
			);
			const matchUrl = new URL(redirectUrl);
			const matchDomain = matchUrl.hostname.replace(/^www\./, '');
			if (
				redirectUrl !== 'undefined' &&
				(status === 'off' || !sites.includes(matchDomain))
			) {
				window.location.href = redirectUrl;
			}
		});
	}
}
