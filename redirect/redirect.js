const getBackgroundPage = browser.runtime.getBackgroundPage();

function refreshRedirect() {

	getBackgroundPage.then( (bg) => {

		const status = bg.getStatus();

		if ( status === 'off' ) {

			const url = new URL( window.location.href );
			const redirect = url.searchParams.get('from');

			if ( redirect !== 'undefined' ) {
				window.location.href = redirect;
			}

		}

	} );

}

refreshRedirect();
