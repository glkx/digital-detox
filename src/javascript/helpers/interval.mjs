'use strict';

export default class Interval {
	constructor(callback, interval, autostart = true) {
		this.callback = callback;
		this.interval = interval;
		this.timerId;

		// Auto start interval on construct
		if (autostart === true) {
			this.start();
		}
		return;
	}

	pause() {
		clearInterval(this.timerId);
		return;
	}

	start() {
		this.timerId = setInterval(this.callback, this.interval);
		return;
	}

	delete() {
		clearInterval(this.timerId);
		this.callback = null;
		this.interval = null;
		return;
	}
}
