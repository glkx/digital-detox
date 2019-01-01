# Digital Detox
[![Maintainability](https://api.codeclimate.com/v1/badges/07ae438cfe4556950bf8/maintainability)](https://codeclimate.com/github/glkx/impulse-blocker/maintainability)

Give yourself a digital detox and block all your impulsive surf behaviour on the web. This extension blocks websites that distract you from what you really want to do. A simple roadblock to prevent procrastination.

## Fork from Impulse Blocker by raicem
You can install the original extension from the official [add-ons page](https://addons.mozilla.org/en-US/firefox/addon/impulse-blocker/). Simple usage instructions are [here](http://raicem.github.io/2017/05/17/impulse-blocker-guide/).

## Export and import blocked websites
You can export and import your blocked websites with an work around through the development console on the extention options page.

Export:
```
getBackgroundPage.then(bg => { let settings = bg.getUserSettings(); console.log(JSON.stringify(settings)); });
```

Import:
```
const settings = JSON.parse('{}');

settings.blockedSites.forEach(function(site) {
	getBackgroundPage.then(bg => {
		bg.addSite(site.url);
	});
});
```

["ziggogo.tv","yts.am","youtube.com","wptavern.com","waitbutwhy.com","vn.nl","vk.com","videoland.com","vice.com","universiteitvannederland.nl","twitter.com","twitch.tv","tweakers.net","tumblr.com","theverge.com","thenextweb.com","southpark.cc.com","snapchat.com","roomed.nl","reddit.com","rarbg.to","primevideo.com","pinterest.com","onemorething.nl","nytimes.com","nu.nl","npostart.nl","nos.nl","newyorker.com","netflix.com","medium.com","mashable.com","londonreal.tv","linkedin.com","lifehacker.com","introvertdear.com","instagram.com","inc.com","imdb.com","iculture.nl","hulu.com","hbonow.com","hardware.info","gizmodo.com","geenstijl.nl","froot.nl","frankwatching.com","fok.nl","filmtotaal.nl","facebook.com","dumpert.nl","decorrespondent.nl","dailymotion.com","culy.nl","cnn.com","buzzfeed.com","bright.nl","blendle.com","bbc.com","bbc.co.uk","awwwards.com","ad.nl","9to5mac.com","9gag.com"]
