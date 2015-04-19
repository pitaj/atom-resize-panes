CompositeDisposable = require('atom').CompositeDisposable;


var AtomResizePanes = (function() {
	'use strict';
	let module = {};

	module.config = {
		handleThickness: {
			type: 'integer',
			default: 10,
			minimum: 0,
			maximum: 100
		},
		updateDelay: {
			description:
				'Milliseconds before creating the resize handles. ' +
				'We need this because we have to wait on the DOM to draw the panes. ' +
				'Try increasing this if the resize handles wont\'t show up or panes doesn\'t get removed properly. ' +
				'Requires reloading Atom.',
			type: 'integer',
			default: 150,
			minimum: 0,
			maximum: 10000
		}
	};

	module.subscriptions = null;

	let max = 95;
	let handleReferences = [];

	module.activate = function() {
		let updateDelay = atom.config.get('atom-resize-panes.updateDelay') || 150;

		module.subscriptions = new CompositeDisposable();

		// Create events for atom's panes.
		module.subscriptions.add(atom.workspace.onDidAddPane(function() { setTimeout(module.createHandles, updateDelay); }));
		module.subscriptions.add(atom.workspace.onDidDestroyPane(function() { setTimeout(module.createHandles, updateDelay); }));

		// Create config events.
		module.subscriptions.add(atom.config.observe('atom-resize-panes.handleThickness', function() { module.createHandles(); }));

		// Create our initial handles.
		setTimeout(module.createHandles, updateDelay);
	};

	module.deactivate = function() {
		module.subscriptions.dispose();
		clearHandles();
		window.removeEventListener("resize", onResize, false);
	};

	module.createHandles = function() {
		// Clear all the handles before creating new ones.
		clearHandles();

		// Just to be sure!
		let handleNodes = document.querySelectorAll('atom-pane-axis > atom-pane-resize-handle');
		if (handleNodes.length > 0) {
			console.error('Not all handles were removed!', handleNodes);
		}

		// Create handles and events.
		let panes = document.querySelectorAll('atom-pane-axis > atom-pane:not(:last-child), ' +
		'atom-pane-axis > atom-pane-axis:not(:last-child)');
		for (let i = 0; i < panes.length; ++i) {
			let pane = panes[i];

			// Create the handle.
			let handle = document.createElement('atom-pane-resize-handle');
			handle.className = 'resize-handle';
			handle.setAttribute('tabindex', '-1');


			// Get the split orientation.
			let orientation = null;
			let tags = pane.parentNode.className.split(' ');
			for (let tag of tags) {
				if (tag === 'horizontal') { orientation = 'horizontal'; break; }
				if (tag === 'vertical') { orientation = 'vertical'; break; }
			}

			if (!orientation) {
				console.error('No orientation found!');
				continue;
			}


			let handleThickness = atom.config.get('atom-resize-panes.handleThickness') || 10;
			let startDragReference = null;

			// ----------------------------------------
			// Create Events for Horizontal Handles

			if (orientation === 'horizontal') {
				// Set the handle thickness.
				handle.style.width = handleThickness + 'px';

				// Add the handle to the DOM.
				pane.insertAdjacentElement('afterend', handle);

				let startWidth;
				let parentWidth;

				let doDrag = function(event) {
					pane.style.maxWidth = pane.style.minWidth = Math.min((startWidth + event.clientX) * parentWidth, max) + '%';
				};

				let stopDrag = function() {
					document.documentElement.removeEventListener('mousemove', doDrag, false);
					document.documentElement.removeEventListener('mouseup', stopDrag, false);
				};

				let resetPosition = function() {
					document.documentElement.removeEventListener('mouseup', resetPosition, false);
					pane.style.maxWidth = pane.style.minWidth = 'initial';
				};

				let startDrag = function(event) {
					if (event.button === 0) {
						startWidth = parseInt(document.defaultView.getComputedStyle(pane).width, 10) - event.clientX;
						parentWidth = 100 / parseInt(document.defaultView.getComputedStyle(pane.parentNode).width, 10);
						document.documentElement.addEventListener('mousemove', doDrag, false);
						document.documentElement.addEventListener('mouseup', stopDrag, false);
					} else if (event.button === 1) {
						document.documentElement.addEventListener('mouseup', resetPosition, false);
					}
				};

				handle.addEventListener('mousedown', startDrag, true);
				startDragReference = startDrag;
			}


			// ----------------------------------------
			// Create Events for Vertical Handles

			if (orientation === 'vertical') {
				// Set the handle thickness.
				handle.style.height = handleThickness + 'px';

				// Add the handle to the DOM.
				pane.insertAdjacentElement('afterend', handle);

				let startHeight;
				let parentHeight;

				let doDrag = function(event) {
					pane.style.maxHeight = pane.style.minHeight = Math.min((startHeight + event.clientY), parentHeight) + 'px';
				};

				let stopDrag = function() {
					document.documentElement.removeEventListener('mousemove', doDrag, false);
					document.documentElement.removeEventListener('mouseup', stopDrag, false);

				};

				let resetPosition = function() {
					document.documentElement.removeEventListener('mouseup', resetPosition, false);
					pane.style.maxHeight = pane.style.minHeight = 'initial';
				};

				let startDrag = function(event) {
					if (event.button === 0) {
						startHeight = parseInt(document.defaultView.getComputedStyle(pane).height, 10) - event.clientY;
						parentHeight = parseInt(document.defaultView.getComputedStyle(pane.parentNode).height, 10) * max / 100;
						document.documentElement.addEventListener('mousemove', doDrag, false);
						document.documentElement.addEventListener('mouseup', stopDrag, false);
					} else if (event.button === 1) {
						document.documentElement.addEventListener('mouseup', resetPosition, false);
					}
				};

				handle.addEventListener('mousedown', startDrag, false);
				startDragReference = startDrag;
			}

			// Create a reference for the handle, so we can properly clean them up later.
			handleReferences.push({handle: handle, startDragReference: startDragReference});
		}
	};

	let clearHandles = function() {
		for (let ref of handleReferences) {
			ref.handle.removeEventListener('mousedown', ref.handle.startDragReference, false);
			ref.handle.parentNode.removeChild(ref.handle);
		}

		handleReferences = [];
	};

	let onResize = function() {
		let panes = document.querySelectorAll('atom-pane-axis.vertical > atom-pane:not(:last-child), ' +
		'atom-pane-axis.vertical > atom-pane-axis:not(:last-child)');
		for (let i = 0; i < panes.length; ++i) {
			let parentHeight = parseInt(document.defaultView.getComputedStyle(panes[i].parentNode).height, 10) * max / 100;
			let currentHeight = parseInt(document.defaultView.getComputedStyle(panes[i]).height, 10);
			panes[i].style.maxHeight = panes[i].style.minHeight = Math.min(currentHeight, parentHeight) + 'px';
		}
	};

	window.addEventListener("resize", onResize, false);

	return module;
}());

module.exports = AtomResizePanes;
