# Digital Detox
[![Maintainability](https://api.codeclimate.com/v1/badges/07ae438cfe4556950bf8/maintainability)](https://codeclimate.com/github/glkx/impulse-blocker/maintainability)

Give yourself a digital detox and block all your impulsive surf behaviour on the web. This extension blocks websites that distract you from what you really want to do. A simple roadblock to prevent procrastination.

## Export and import blocked websites
You can export and import your blocked websites with an work around through the development console on the extention options page.

Export:
```
getBackgroundPage.then(bg => { const options = bg.getUserOptions(); console.log(JSON.stringify(options)); });
```

Import:
```
const options = JSON.parse('{}');

options.blockedSites.forEach(function(site) {
	getBackgroundPage.then(bg => {
		bg.addSite(site.url, site.time);
	});
});
```

## Fork from Impulse Blocker by raicem
Digital Detox is inspired by and fork from [Impulse Blocker](https://addons.mozilla.org/en-US/firefox/addon/impulse-blocker/).
