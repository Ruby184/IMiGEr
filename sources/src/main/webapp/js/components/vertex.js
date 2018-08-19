/**
 * Class representing a vertex in graph.
 * @constructor
 * @param {object} props Properties of the vertex.
 */
function Vertex(props) {
	/** @prop {integer} id Unique identifier of the vertex. */
	this.id = props.id;
	/** @prop {string} name Name of the vertex. */
	this.name = props.name;
	/** @prop {array} symbol Symbol of the group. */
	this.symbol = app.markSymbol.getMarkSymbol();

	var rootElement;
	var symbolListComponent;

	var position = new Coordinates(0, 0);
	var size = {
		width: Math.max(30 + props.name.length * 8.3, 200),	// 8.3 is approximate width (in pixels) of one character using Consolas at 15px font size
		height: 30,
	};
	var group = null;
	var floater = null;

	var pan = false;
	var excluded = false;
	var found = false;
	var dimmed = false;
	var highlighted = false;
	var highlightedRequired = false;
	var highlightedProvided = false;
	var highlightedRequiredNeighbours = false;
	var highlightedProvidedNeighbours = false;
	var iconsDisplayed = false;

	var inEdgeList = [];
	var outEdgeList = [];
	var symbolList = [];
	
	/**
	 * Adds a new edge ending in the vertex. Its ending point is moved to the current position of the vertex.
	 * @param {Edge} edge Edge going to the vertex.
	 */
	this.addInEdge = function(edge) {
		if (!(edge instanceof Edge)) {
			throw new TypeError(edge.toString() + 'is not instance of Edge');
		}
		
		edge.setTo(this);
		
		inEdgeList.push(edge);
	};
	
	/**
	 * Adds a new edge starting in the vertex. Its starting point is moved to the current position of the vertex.
	 * @param {Edge} edge Edge going from the vertex.
	 */
	this.addOutEdge = function(edge) {
		if (!(edge instanceof Edge)) {
			throw new TypeError(edge.toString() + 'is not instance of Edge');
		}
		
		edge.setFrom(this);
		
		outEdgeList.push(edge);
	};

	/**
	 * @returns {array<Edge>} Array of edges going to the vertex.
	 */
	this.getInEdgeList = function() {
		return inEdgeList;
	};

	/**
	 * @returns {array<Edge>} Array of edges going from the vertex.
	 */
	this.getOutEdgeList = function() {
		return outEdgeList;
	};

	/**
	 * 
	 * @param {array} symbol Node symbol to be displayed next to the vertex.
	 */
	this.addSymbol = function(symbol) {
		symbolList.push(symbol);

		if (excluded) return;

		symbolListComponent.appendChild(symbol);
	};

	this.removeSymbol = function(symbol) {
		symbolList.splice(symbolList.indexOf(symbol), 1);

		if (excluded) return;

		symbolListComponent.removeChild(symbol);
	};

	this.countEdges = function() {
		return inEdgeList.length + outEdgeList.length;
	};
	
	/**
	 * @returns {Coordinates} Current position of the vertex.
	 */
	this.getPosition = function() {
		return position;
	};

	/**
	 * Updates the current position of the vertex in graph.
	 */
	this.setPosition = function(coords) {
		if (!(coords instanceof Coordinates)) {
			throw new TypeError(coords.toString() + 'is not instance of Coordinates');
		}

		position = coords;
	};

	/**
	 * @returns {Coordinates} Centre of the group.
	 */
	this.getCenter = function() {
		return new Coordinates(
			position.x + size.width / 2,
			position.y + size.height / 2,
		);
	};

	/**
	 * Moves the vertex to a new position in graph. Edges related to the vertex are moved as well.
	 * @param {Coordinates} coords Coordinates to be moved to.
	 */
	this.move = function(coords) {
		if (!(coords instanceof Coordinates)) {
			throw new TypeError(coords.toString() + 'is not instance of Coordinates');
		}

		rootElement.setAttribute('x', coords.x);
		rootElement.setAttribute('y', coords.y);

		inEdgeList.forEach(function(edge) {
			edge.moveEnd(new Coordinates(
				coords.x + size.width / 2,
				coords.y + size.height / 2
			));
		});
	
		outEdgeList.forEach(function(edge) {
			edge.moveStart(new Coordinates(
				coords.x + size.width / 2,
				coords.y + size.height / 2
			));
		});
	};

	/**
	 * @returns {Group} Group this vertex is part of. If the vertex stands alone, null is returned.
	 */
	this.getGroup = function() {
		return group;
	};

	/**
	 * Sets a new group that the vertex is added to. If the vertex is currently excluded, its floating point is destroyed.
	 * @param {Group} newValue Group this vertex is a part of.
	 */
	this.setGroup = function(newValue) {
		if (!(newValue instanceof Group) && newValue !== null) {
			throw new TypeError(newValue.toString() + 'is neither instance of Group nor null');
		}

		group = newValue;

		if (newValue && this.isExcluded()) {
			// remove floater
			app.sidebarComponent.removeFloater(floater);
			delete floater;
		}
	};

	/**
	 * Sets the vertex as found. Highlighting is skipped when the vertex is excluded.
	 * @param {boolean} newValue True to mark the vertex as found, otherwise false.
	 */
	this.setFound = function(newValue) {
		found = newValue;

		if (excluded) return;
		
		if (newValue) {
			rootElement.classList.add('vertex--found');
		} else {
			rootElement.classList.remove('vertex--found');
		}
	};

	/**
	 * Toggles transparency of the vertex. Style change is skipped when the vertex is excluded.
	 * @param {boolean} newValue True to dim the vertex, false to display it normally.
	 */
	this.setDimmed = function(newValue) {
		dimmed = newValue;

		if (excluded) return;

		if (newValue) {
			rootElement.classList.add('node--dimmed');
		} else {
			rootElement.classList.remove('node--dimmed');
		}
	};

	/**
	 * Toggles highlighting of the vertex.
	 * @param {boolean} newValue True to highlight the vertex, otherwise false.
	 */
	this.setHighlighted = function(newValue) {
		highlighted = newValue;

		if (newValue) {
			rootElement.classList.add('node--highlighted');
		} else {
			rootElement.classList.remove('node--highlighted');
		}
	};

	/**
	 * Toggles highlighting of the vertex to mark it as requirement of some other node.
	 * @param {boolean} newValue True to highlight the vertex as required, false to unhighlight.
	 */
	this.setHighlightedRequired = function(newValue) {
		highlightedRequired = newValue;

		if (newValue) {
			rootElement.classList.add('node--highlighted-required');
		} else {
			rootElement.classList.remove('node--highlighted-required');
		}

		if (group !== null) {
			group.setHighlightedRequired(newValue);
		}
	};
	
	/**
	 * Toggles highlighting of the vertex to mark it as dependent of some other node.
	 * @param {boolean} newValue True to highlight the vertex as provided, false to unhighlight.
	 */
	this.setHighlightedProvided = function(newValue) {
		highlightedProvided = newValue;

		if (newValue) {
			rootElement.classList.add('node--highlighted-provided');
		} else {
			rootElement.classList.remove('node--highlighted-provided');
		}

		if (group !== null) {
			group.setHighlightedProvided(newValue);
		}
	};
	
	/**
	 * Toggles highlighting of the vertex when only its requirements should be highlighted. Anytime this value is changed, generic
	 * {@link Vertex#setHighlighted} method should be called too.
	 * @param {boolean} newValue True to highlight the vertex when only its requirements should be highlighted, false to unhighlight.
	 */
	this.setHighlightedRequiredNeighbours = function(newValue) {
		highlightedRequiredNeighbours = newValue;

		if (newValue) {
			rootElement.classList.add('node--highlighted-required-neighbours');
		} else {
			rootElement.classList.remove('node--highlighted-required-neighbours');
		}
	};
	
	/**
	 * Toggles highlighting of the vertex when only its dependents should be highlighted. Anytime this value is changed, generic 
	 * {@link Vertex#setHighlighted} method should be called too.
	 * @param {boolean} newValue True to highlight the vertex when only its dependents should be highlighted, false to unhighlight.
	 */
	this.setHighlightedProvidedNeighbours = function(newValue) {
		highlightedProvidedNeighbours = newValue;

		if (newValue) {
			rootElement.classList.add('node--highlighted-provided-neighbours');
		} else {
			rootElement.classList.remove('node--highlighted-provided-neighbours');
		}
	};

	/**
	 * @returns {boolean} True is the vertex is currently excluded from the viewport, otherwise false.
	 */
	this.isExcluded = function() {
		return excluded;
	};

	/**
	 * Toggles excluded state of the vertex. If the vertex is set excluded, a new floating point is created to connect it with 
	 * related nodes in the viewport. Otherwise, the floating point is deleted.
	 * Any node is called excluded when it is not visible in the viewport but instead in the sidebar.
	 * @param {boolean} newValue True to set the vertex as excluded, otherwise false.
	 */
	this.setExcluded = function(newValue) {
		excluded = newValue;

		if (group !== null) return;

		if (newValue) {
			// set floater
			floater = new FloatingPoint;
			floater.setNode(this);
			app.sidebarComponent.addFloater(floater);

		} else {
			// remove floater
			app.sidebarComponent.removeFloater(floater);
			delete floater;
		}
	};

	/**
	 * Excludes the vertex from the viewport. Removes vertex DOM element and hides its edges.
	 */
	this.exclude = function() {
		this.setExcluded(true);
		this.remove(true);

		app.viewportComponent.removeVertex(this);
	};

	/**
	 * Includes the vertex in the viewport. Afterwards, edges related to the vertex are moved to the current position of the vertex.
	 */
	this.include = function() {
		this.removeFromSidebarList();

		this.setExcluded(false);
		this.remove(false);

		app.viewportComponent.addVertex(this);

		// set edges' ends
		var inEdgeList = this.getInEdgeList();
		inEdgeList.forEach(function(edge) {
			edge.setTo(this);
			edge.moveEnd(this.getCenter());
		}, this);

		var outEdgeList = this.getOutEdgeList();
		outEdgeList.forEach(function(edge) {
			edge.setFrom(this);
			edge.moveStart(this.getCenter());
		}, this);
	};

	/**
	 * Hook function used to remove the vertex from the sidebar list it is located in before it is moved to the viewport.
	 */
	this.removeFromSidebarList = app.utils.noop;

	/**
	 * @returns {boolean} True if the vertex is not connected to any other nodes.
	 */
	this.isUnconnected = function() {
		return inEdgeList.length === 0 && outEdgeList.length === 0;
	};

	/**
	 * Creates a new DOM element representing the vertex in memory. The element being created depends on whether the vertex
	 * is excluded at the moment. Binds user interactions to local handler functions.
	 * @returns {Element} HTML or SVG DOM element depending on whether the vertex is excluded.
	 */
	this.render = function() {
		rootElement = excluded ? renderExcluded.call(this) : renderIncluded.call(this);

		this.setHighlighted(highlighted);
		this.setHighlightedRequiredNeighbours(highlightedRequiredNeighbours);
		this.setHighlightedProvidedNeighbours(highlightedProvidedNeighbours);

		return rootElement;
	};
	
	/**
	 * Removes the DOM element representing the vertex from document.
	 * @param {boolean} hideEdges True to hide edges related to the vertex in the viewport. Edges are (almost) never really
	 * removed but rather hidden for cases when a node is included back in the viewport.
	 */
	this.remove = function(hideEdges) {
		rootElement.remove();

		// toggle edges
		inEdgeList.filter(function(edge) {
			return !edge.getFrom().isExcluded();
		}).forEach(function(edge) {
			edge.setHidden(hideEdges);
		});

		outEdgeList.filter(function(edge) {
			return !edge.getTo().isExcluded();
		}).forEach(function(edge) {
			edge.setHidden(hideEdges);
		});
	};

	/**
	 * @returns {Element} SVG DOM element.
	 */
	function renderIncluded() {
		rootElement = app.utils.createSvgElement('svg', {
			'class': 'node vertex',
			'x': position.x,
			'y': position.y,
			'data-id': this.id,
			'data-name': this.name,
		});
		rootElement.addEventListener('click', click.bind(this));
		rootElement.addEventListener('contextmenu', contextMenu.bind(this));
		rootElement.addEventListener('mousedown', mouseDown.bind(this));
		
		rootElement.appendChild(app.utils.createSvgElement('rect', {
			'height': size.height,
			'width': size.width,
			'x': 1,
			'y': 1,
		}));
		
		// interface
		var interface = app.utils.createSvgElement('g', {
			'class': 'interface',
			'transform': 'translate(8, 8)',
		});
		interface.addEventListener('click', interfaceClick.bind(this));
		
		interface.appendChild(app.utils.createSvgElement('rect', {
			'width': 10,
			'height': 15,
			'x': 0,
			'y': 0,
		}));
		interface.appendChild(app.utils.createSvgElement('rect', {
			'width': 6,
			'height': 3,
			'x': -3,
			'y': 3,
		}));
		interface.appendChild(app.utils.createSvgElement('rect', {
			'width': 6,
			'height': 3,
			'x': -3,
			'y': 9,
		}));
		rootElement.appendChild(interface);
		
		// name
		var nameText = app.utils.createSvgElement('text', {
			'fill': 'black',
			'x': 25,
			'y': 20,
		});
		nameText.appendChild(document.createTextNode(props.name));
		rootElement.appendChild(nameText);

		// symbol list
		symbolListComponent = new VertexSymbolList;
		rootElement.appendChild(symbolListComponent.render());

		symbolList.forEach(function(symbol) {
			symbolListComponent.appendChild(symbol);
		}, this);

		return rootElement;
	}

	/**
	 * @returns {Element} HTML DOM element.
	 */
	function renderExcluded() {
		rootElement = app.utils.createHtmlElement('li', {
			'class': 'node vertex',
			'data-id': props.id,
		});

		var svg = app.utils.createSvgElement('svg', {
			'xmlns': 'http://www.w3.org/2000/svg',
			'height': 60,
			'width': 46,
		});
		rootElement.appendChild(svg);

		var group = app.utils.createSvgElement('g', {
			'transform': 'translate(60,10)',
		});
		svg.appendChild(group);

		// required
		var required = app.utils.createSvgElement('g', {
			'class': 'required-counter',
		});
		required.addEventListener('click', requiredClick.bind(this));
		group.appendChild(required);

		required.appendChild(app.utils.createSvgElement('line', {
			'x1': -50,
			'y1': 5,
			'x2': -42,
			'y2': 5,
			'stroke': 'black',
			'class': 'outer-floater',
		}));
		required.appendChild(app.utils.createSvgElement('line', {
			'x1': -20,
			'y1': 5,
			'x2': -14,
			'y2': 5,
			'stroke': 'black',
		}));
		required.appendChild(app.utils.createSvgElement('rect', {
			'x': -58,
			'y': 1,
			'width': 8,
			'height': 8,
			'class': 'outer-port',
		}));
		required.appendChild(app.utils.createSvgElement('path', {
			'class': 'lollipop',
			'd': 'M-31,-5 C-16,-5 -16,15 -31,16',
		}));

		var requiredCounterText = app.utils.createSvgElement('text', {
			'x': -36,
			'y': 10,
		});
		requiredCounterText.appendChild(document.createTextNode(props.importedPackages.length));
		required.appendChild(requiredCounterText);

		// provided
		var provided = app.utils.createSvgElement('g', {
			'class': 'provided-counter',
		});
		provided.addEventListener('click', providedClick.bind(this));
		group.appendChild(provided);

		provided.appendChild(app.utils.createSvgElement('line', {
			'x1': -50,
			'y1': 35,
			'x2': -44,
			'y2': 35,
			'stroke': 'black',
			'class': 'outer-floater',
		}));
		provided.appendChild(app.utils.createSvgElement('line', {
			'x1': -20,
			'y1': 35,
			'x2': -14,
			'y2': 35,
			'stroke': 'black',
		}));
		provided.appendChild(app.utils.createSvgElement('rect', {
			'x': -58,
			'y': 31,
			'width': 8,
			'height': 8,
			'class': 'outer-port',
		}));
		provided.appendChild(app.utils.createSvgElement('circle', {
			'class': 'lollipop',
			'cx': -32,
			'cy': 35,
			'r': 11,
		}));

		var providedCounterText = app.utils.createSvgElement('text', {
			'x': -36,
			'y': 40,
		});
		providedCounterText.appendChild(document.createTextNode(props.exportedPackages.length));
		provided.appendChild(providedCounterText);

		// name
		var nameText = app.utils.createHtmlElement('div', {
			'class': 'vertex-name',
			'title': this.name,
		});
		nameText.appendChild(document.createTextNode(this.name));
		nameText.addEventListener('click', click.bind(this));
		rootElement.appendChild(nameText);

		// buttons
		var buttonGroup = app.utils.createHtmlElement('div', {
			'class': 'button-group',
		});
		rootElement.appendChild(buttonGroup);

		// show symbol button
		var showSymbolButton = app.utils.createHtmlElement('button', {
			'class': 'show-symbol-button button',
			'style': 'background-color: ' + this.symbol[1] + ';',
			'title': 'Show symbol next to all neighbouring components',
		});
		showSymbolButton.appendChild(document.createTextNode(this.symbol[0]));
		showSymbolButton.addEventListener('click', showIconClick.bind(this));
		buttonGroup.appendChild(showSymbolButton);

		// to change button
		var toChangeButton = app.utils.createHtmlElement('button', {
			'class': 'change-button button',
			'title': 'Set component for change',
		});
		toChangeButton.appendChild(app.utils.createHtmlElement('img', {
			'src': 'images/tochange/tochange-trans.gif',
			'alt': 'Icon of "set component for change" action',
		}));
		toChangeButton.addEventListener('click', addToChange.bind(this));
		buttonGroup.appendChild(toChangeButton);

		// include button
		var includeButton = app.utils.createHtmlElement('button', {
			'class': 'include-button button',
			'title': 'Display node in viewport',
		});
		includeButton.appendChild(app.utils.createHtmlElement('img', {
			'src': 'images/button_cancel.png',
			'alt': 'Icon of "Icon of "display node in viewport" action" action',
		}));
		includeButton.addEventListener('click', includeClick.bind(this));
		buttonGroup.appendChild(includeButton);

		// set floater element
		floater.setElement(rootElement);

		// set edges' ends
		var inEdgeList = this.getInEdgeList();
		inEdgeList.forEach(function(edge) {
			floater.addInEdge(edge);
		});

		var outEdgeList = this.getOutEdgeList();
		outEdgeList.forEach(function(edge) {
			floater.addOutEdge(edge);
		});

		return rootElement;
	}
	
	/**
	 * Vertex click interaction. Based on whether the vertex is excluded and currently selected mouse mode (move, exclude),
	 * the vertex is either highlighted or moved within the graph.
	 */
	function click() {
		if (excluded) {
			this.setHighlighted(!highlighted);
			this.setHighlightedRequiredNeighbours(highlighted);
			this.setHighlightedProvidedNeighbours(highlighted);

			highlightNeighbours.call(this);
			return;
		}

		if (pan) {
			pan = false;
			return;
		}

		switch (document.actionForm.actionMove.value) {
			case 'move':
				this.setHighlighted(!highlighted);
				this.setHighlightedRequiredNeighbours(highlighted);
				this.setHighlightedProvidedNeighbours(highlighted);

				highlightNeighbours.call(this);
				break;

			case 'exclude':
				this.exclude.call(this);

				app.sidebarComponent.excludedNodeListComponent.add(this);
				break;
		}
	}

	/**
	 * Highlights the vertex as a requirement.
	 */
	function requiredClick() {
		this.setHighlighted(!highlighted);
		this.setHighlightedRequiredNeighbours(highlighted);
		this.setHighlightedProvidedNeighbours(false);

		highlightRequiredNeighbours.call(this);
	}

	/**
	 * Highlights the vertex as a dependent.
	 */
	function providedClick() {
		this.setHighlighted(!highlighted);
		this.setHighlightedRequiredNeighbours(false);
		this.setHighlightedProvidedNeighbours(highlighted);

		highlightProvidedNeighbours.call(this);
	}
	
	/**
	 * Reveals vertex popover.
	 * @param {Event} e Click event.
	 */
	function interfaceClick(e) {
		e.stopPropagation();

		app.viewportComponent.vertexPopoverComponent.setContent(props.symbolicName, props.exportedPackages, props.importedPackages);
		app.viewportComponent.vertexPopoverComponent.setPosition(new Coordinates(e.clientX, e.clientY));
		app.viewportComponent.vertexPopoverComponent.open();
	}

	/**
	 * Displays symbol of the vertex next to all nodes that it is connected with.
	 * @param {Event} e Click event.
	 */
	function showIconClick(e) {
		iconsDisplayed = !iconsDisplayed;

		var neighbourList = [];

		inEdgeList.filter(function(edge) {
			return !edge.getFrom().isExcluded();
		}).forEach(function(edge) {
			neighbourList.push(edge.getFrom());
		});

		outEdgeList.filter(function(edge) {
			return !edge.getTo().isExcluded();
		}).forEach(function(edge) {
			neighbourList.push(edge.getTo());
		});

		neighbourList.forEach(function(node) {
			if (iconsDisplayed) {
				node.addSymbol(this.symbol);
			} else {
				node.removeSymbol(this.symbol);
			}
		}, this);
	}

	/**
	 * Adds the vertex to the list of components to be changed.
	 * @param {Event} e Click event.
	 */
	function addToChange(e) {
		app.sidebarComponent.addToChange(this);
	}

	/**
	 * Includes the group back to the viewport.
	 */
	function includeClick() {
		this.include.call(this);
	}

	/**
	 * Vertex right click interaction. Displays context menu filled with items representing groups that the vertex can be added to.
	 * @param {Event} e Context menu event.
	 */
	function contextMenu(e) {
		e.preventDefault();

		var excludedNodeList = app.sidebarComponent.excludedNodeListComponent.getNodeList();
		var includedGroupList = app.viewportComponent.getGroupList();

		var nodeList = [].concat(excludedNodeList, includedGroupList);
		if (nodeList.length === 0) return;

		app.viewportComponent.contextMenuComponent.setVertex(this);

		// fill list with items
		nodeList.forEach(function(node) {
			app.viewportComponent.contextMenuComponent.addNode(node);
		});

		app.viewportComponent.contextMenuComponent.setPosition(new Coordinates(e.clientX, e.clientY));
		app.viewportComponent.contextMenuComponent.open();
	}
	
	/**
	 * Handles drag and drop interaction with the vertex. At the moment mouse button is pressed, it is not yet known whether 
	 * it is just clicked or dragged.
	 * @param {Event} e Mouse down event.
	 */
	function mouseDown(e) {
		e.stopPropagation();
		app.closeFloatingComponents();
		
		var self = this;
		var start = new Coordinates(e.clientX, e.clientY);

		rootElement.classList.add('node--dragged');
		
		document.body.addEventListener('mousemove', mouseMove);
		document.body.addEventListener('mouseup', mouseUp);
		document.body.addEventListener('mouseleave', mouseUp);

		/**
		 * At the moment mouse is moved, the vertex is clearly being dragged. The vertex is moved to the current position of mouse.
		 * @param {Event} e Mouse move event.
		 */
		function mouseMove(e) {
			pan = true;

			self.move(new Coordinates(
				position.x - (start.x - e.clientX) / app.zoom.scale,
				position.y - (start.y - e.clientY) / app.zoom.scale,
			));
		}

		/**
		 * At the moment mouse button is released, dragging is done and its final position is set to the vertex.
		 * @param {Event} e Mouse up event.
		 */
		function mouseUp(e) {
			self.setPosition(new Coordinates(
				+rootElement.getAttribute('x'),
				+rootElement.getAttribute('y'),
			));

			rootElement.classList.remove('node--dragged');
			
			document.body.removeEventListener('mousemove', mouseMove);
			document.body.removeEventListener('mouseup', mouseUp);
			document.body.removeEventListener('mouseleave', mouseUp);
		}
	}
	
	/**
	 * Highlights all neighbours of the vertex. They are either highlighted as required or provided, or dimmed.
	 */
	function highlightNeighbours() {
		this.setDimmed(false);
		this.setHighlightedRequired(false);
		this.setHighlightedProvided(false);

		if (highlighted) {
			// dim and unhighlight all nodes but this
			app.nodeList.forEach(function(node) {
				if (node === this) return;

				node.setDimmed(true);

				node.setHighlighted(false);
				node.setHighlightedRequired(false);
				node.setHighlightedProvided(false);
				node.setHighlightedRequiredNeighbours(false);
				node.setHighlightedProvidedNeighbours(false);
			}, this);

			// dim and unhighlight all edges
			app.edgeList.forEach(function(edge) {
				edge.setHidden(edge.getFrom().isExcluded() || edge.getTo().isExcluded());
				edge.setDimmed(true);

				edge.setHighlighted(false);
				edge.setHighlightedRequired(false);
				edge.setHighlightedProvided(false);
			});

			// highlight required neighbours
			inEdgeList.forEach(function(edge) {
				edge.setHidden(false);
				edge.setDimmed(false);
				edge.setHighlightedRequired(true);

				edge.getFrom().setDimmed(false);
				edge.getFrom().setHighlightedRequired(true);
			});

			// highlight provided neighbours
			outEdgeList.forEach(function(edge) {
				edge.setHidden(false);
				edge.setDimmed(false);
				edge.setHighlightedProvided(true);

				edge.getTo().setDimmed(false);
				edge.getTo().setHighlightedProvided(true);
			});

		} else {
			app.nodeList.forEach(function(node) {
				node.setDimmed(false);

				node.setHighlighted(false);
				node.setHighlightedRequired(false);
				node.setHighlightedProvided(false);
				node.setHighlightedRequiredNeighbours(false);
				node.setHighlightedProvidedNeighbours(false);
			}, this);

			app.edgeList.forEach(function(edge) {
				edge.setHidden(edge.getFrom().isExcluded() || edge.getTo().isExcluded());
				edge.setDimmed(false);

				edge.setHighlighted(false);
				edge.setHighlightedRequired(false);
				edge.setHighlightedProvided(false);
			});
		}
	}

	/**
	 * Highlights only neighbours the vertex that are required.
	 */
	function highlightRequiredNeighbours() {
		if (highlighted) {
			inEdgeList.forEach(function(edge) {
				edge.setHidden(false);
				edge.setHighlightedRequired(true);
				edge.getFrom().setHighlightedRequired(true);
			});

		} else {
			inEdgeList.forEach(function(edge) {
				edge.setHidden(true);
				edge.setHighlightedRequired(false);
				edge.getFrom().setHighlightedRequired(false);
			});
		}
	}

	/**
	 * Highlights only neighbours the vertex that are provided.
	 */
	function highlightProvidedNeighbours() {
		if (highlighted) {
			outEdgeList.filter(function(edge) {
				return !edge.getTo().isExcluded();
			}).forEach(function(edge) {
				edge.setHidden(false);
				edge.setHighlightedProvided(true);
				edge.getTo().setHighlightedProvided(true);
			});

		} else {
			outEdgeList.filter(function(edge) {
				return !edge.getTo().isExcluded();
			}).forEach(function(edge) {
				edge.setHidden(true);
				edge.setHighlightedProvided(false);
				edge.getTo().setHighlightedProvided(false);
			});
		}
	}
}