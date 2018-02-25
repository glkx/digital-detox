var getBackgroundPage;

document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
    getBackgroundPage = browser.runtime.getBackgroundPage();

    localizeRedirect();
    restoreRedirect();
}

function localizeRedirect() {
    const getI18nMsg = browser.i18n.getMessage;
    document.getElementById('redirectTitleText').innerText = getI18nMsg('redirectTitleText');
    document.getElementById('redirectShortDescText').innerText = getI18nMsg('redirectShortDescText');
}

function restoreRedirect() {

    getBackgroundPage.then((bg) => {
        const status = bg.getStatus();
        if (status === 'off') {
            const url = new URL(window.location.href);
            const redirect = url.searchParams.get('from');
            if (redirect !== 'undefined') {
                window.location.href = redirect;
            }
        }
    });

}
