'use strict';

// Variables
import runtimeMessage from './variables/runtimeMessages';

// Modules
import DigitalDetox from './modules/blocker';
import Domain from './modules/domain';

// Blocker optionss
DigitalDetox.options = {
	status: 'on',
	idleManagement: true,
	processInterval: {
		syncLocalOptions: 1000,
		syncUserOptions: 30000,
		statusInterval: 6000
	},
	updateBlockerInterval: 1000,
	disableDuration: 5400000,
	history: []
};

// Default local options
DigitalDetox.localOptions = {
	status: null,
	statusModified: 0,
	history: null
};

// Default user options meant to be synct
DigitalDetox.userOptions = {
	blockedSites: [
		// Social media
		{
			url: 'facebook.com',
			time: 0
		},
		{
			url: 'tumblr.com',
			time: 0
		},
		{
			url: 'instagram.com',
			time: 0
		},
		{
			url: 'twitter.com',
			time: 0
		},
		{
			url: 'snapchat.com',
			time: 0
		},
		{
			url: 'vk.com',
			time: 0
		},
		{
			url: 'pinterest.com',
			time: 0
		},
		{
			url: 'reddit.com',
			time: 0
		},
		{
			url: 'linkedin.com',
			time: 0
		},
		// Video streaming
		{
			url: 'youtube.com',
			time: 0
		},
		{
			url: 'netflix.com',
			time: 0
		},
		{
			url: 'primevideo.com',
			time: 0
		},
		{
			url: 'hulu.com',
			time: 0
		},
		{
			url: 'hbonow.com',
			time: 0
		},
		{
			url: 'videoland.com',
			time: 0
		},
		{
			url: 'dumpert.nl',
			time: 0
		},
		{
			url: 'dailymotion.com',
			time: 0
		},
		{
			url: 'twitch.tv',
			time: 0
		},
		// Entertainment
		{
			url: '9gag.com',
			time: 0
		},
		{
			url: 'buzzfeed.com',
			time: 0
		}
	],
	disableDuration: null // TODO: Add disable duration to options page
};

DigitalDetox.init();

/**
 * Messages
 */

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.type) {
		case runtimeMessage.getStatus:
			sendResponse(DigitalDetox.getStatus());
			break;

		case runtimeMessage.disableBlocker:
			sendResponse(DigitalDetox.disableBlocker());
			break;

		case runtimeMessage.enableBlocker:
			sendResponse(DigitalDetox.enableBlocker());
			break;

		case runtimeMessage.getCurrentDomain:
			sendResponse(Domain.getCurrent());
			break;

		case runtimeMessage.getLocalOptions:
			sendResponse(DigitalDetox.getLocalOptions());
			break;

		case runtimeMessage.getUserOptions:
			sendResponse(DigitalDetox.getUserOptions());
			break;

		case runtimeMessage.syncUserOptions:
			sendResponse(DigitalDetox.syncUserOptions());
			break;

		case runtimeMessage.getBlockedSites:
			sendResponse(DigitalDetox.getBlockedSites());
			break;

		case runtimeMessage.getAllSites:
			sendResponse(DigitalDetox.getUserOptions().blockedSites);
			break;

		case runtimeMessage.getHistory:
			sendResponse(DigitalDetox.getLocalOptions().history);
			break;

		case runtimeMessage.resetHistory:
			// Empty history
			DigitalDetox.updateLocalOptions(
				'history',
				DigitalDetox.options.history
			);

			// Update history modification date
			DigitalDetox.updateLocalOptions('historyModified', Date.now());

			sendResponse(true);
			break;

		case runtimeMessage.addSite:
			sendResponse(DigitalDetox.addSite(request.url, request.time));
			break;

		case runtimeMessage.removeSite:
			sendResponse(DigitalDetox.removeSite(request.url));
			break;

		default:
			sendResponse(new Error('Message request type does not exist'));
			break;
	}

	return;
});
