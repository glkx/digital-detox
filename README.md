# Digital Detox
[![Current version](https://img.shields.io/github/release/glkx/digital-detox/all.svg)](https://github.com/glkx/digital-detox/releases/latest) [![Firefox 57+](https://img.shields.io/badge/Firefox-57%2B-orange.svg)](https://www.mozilla.org/firefox) [![Maintainability](https://api.codeclimate.com/v1/badges/07ae438cfe4556950bf8/maintainability)](https://codeclimate.com/github/glkx/impulse-blocker/maintainability)

Give yourself a digital detox and block all your impulsive surf behaviour on the web. This extension blocks websites that distract you from what you really want to do. A simple roadblock to prevent procrastination.

## Export and import blocked websites
You can export and import your blocked websites with an work around through the development console on the extention options page.

Export:
```
browser.runtime.getBackgroundPage().then(bg => { const options = bg.getUserOptions(); console.log(JSON.stringify(options)); });
```

Import:
```
const options = JSON.parse('{}');

options.blockedSites.forEach(function(site) {
	browser.runtime.getBackgroundPage().then(bg => {
		bg.addSite(site.url, site.time);
	});
});
```

## Fork from Impulse Blocker by raicem
Digital Detox is inspired by and fork from [Impulse Blocker](https://addons.mozilla.org/en-US/firefox/addon/impulse-blocker/).
