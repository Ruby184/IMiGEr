/**
 * @constructor
 * @param {object} props Properties of the node list.
 */
function SidebarExcludedNodeList(props) {
	/** @prop {string} id Identifier of the component. */
	this.id = props.id;

	var rootElement;
	var buttonGroup;
	var sortListElement;
	var nodeListElement;

	var nodeList = [];

	this.getNodeList = function() {
		return nodeList;
	};

	this.add = function(node) {
		if (!(node instanceof Vertex) && !(node instanceof Group)) {
			throw new TypeError(node.toString() + 'is instance of neither Vertex nor Group');
		}

		// set remove hook
		node.removeFromSidebarList = this.remove.bind(this, node);

		nodeList.push(node);
		nodeListElement.appendChild(node.render());

		app.redrawEdges();

		toggleControls.call(this);
	};

	this.remove = function(node) {
		if (!(node instanceof Vertex) && !(node instanceof Group)) {
			throw new TypeError(node.toString() + 'is instance of neither Vertex nor Group');
		}

		// unset remove hook
		node.removeFromSidebarList = app.utils.noop;

		nodeList.splice(nodeList.indexOf(node), 1);
		node.remove(false);

		app.redrawEdges();

		toggleControls.call(this);
	};

	this.render = function() {
		rootElement = app.utils.createHtmlElement('div', {
			'id': props.id,
			'class': 'node-container excluded-nodes ' + (props.class ? props.class : ''),
		});
		rootElement.addEventListener('scroll', function() {
			app.redrawEdges();
		});

		// title
		rootElement.appendChild(app.dom.htmlStringToElement('<h2 class="node-container-title">Excluded components</h2>'));

		// buttons
		buttonGroup = app.utils.createHtmlElement('div', {
			'class': 'button-group hidden',
		});
		rootElement.appendChild(buttonGroup);

		// include all button
		var includeAllButton = app.utils.createHtmlElement('button', {
			'class': 'include-all-button button',
			'title': 'Display all excluded nodes in viewport',
		});
		includeAllButton.appendChild(app.utils.createHtmlElement('img', {
			'src': 'images/button_cancel.png',
			'alt': 'Icon of "display all excluded nodes in viewport" action',
		}));
		includeAllButton.addEventListener('click', includeAll.bind(this));
		buttonGroup.appendChild(includeAllButton);

		// sorting options
		sortListElement = app.utils.createHtmlElement('ul', {
			'class': 'sort-list hidden',
		});
		rootElement.appendChild(sortListElement);

		var sortByNameAscListItem = app.utils.createHtmlElement('li', {
			'class': 'sort-asc',
		});
		sortByNameAscListItem.appendChild(app.utils.createTextElement('name'));
		sortByNameAscListItem.addEventListener('click', sortByName.bind(this, 1));
		sortListElement.appendChild(sortByNameAscListItem);

		var sortByNameDescListItem = app.utils.createHtmlElement('li', {
			'class': 'sort-desc',
		});
		sortByNameDescListItem.appendChild(app.utils.createTextElement('name'));
		sortByNameDescListItem.addEventListener('click', sortByName.bind(this, -1));
		sortListElement.appendChild(sortByNameDescListItem);

		var sortByCountAscListItem = app.utils.createHtmlElement('li', {
			'class': 'sort-asc',
		});
		sortByCountAscListItem.appendChild(app.utils.createTextElement('#components'));
		sortByCountAscListItem.addEventListener('click', sortByCount.bind(this, 1));
		sortListElement.appendChild(sortByCountAscListItem);

		var sortByCountDescListItem = app.utils.createHtmlElement('li', {
			'class': 'sort-desc',
		});
		sortByCountDescListItem.appendChild(app.utils.createTextElement('#components'));
		sortByCountDescListItem.addEventListener('click', sortByCount.bind(this, -1));
		sortListElement.appendChild(sortByCountDescListItem);

		// list
		nodeListElement = app.utils.createHtmlElement('ul', {
			'class': 'node-list',
		});
		rootElement.appendChild(nodeListElement);

		return rootElement;
	};

	this.reset = function() {
		nodeList = [];

		$(nodeListElement).empty();

		toggleControls.call(this);
	};

	function includeAll() {
		var nodeListCopy = nodeList.slice(0);
		nodeListCopy.forEach(function(node) {
			node.include();
		}, this);

		toggleControls.call(this);
	}

	function sortByName(sortOrder) {
		nodeList.sort(function(a, b) {
			return sortOrder * a.name.localeCompare(b.name);
		});

		sort.call(this);
	}

	function sortByCount(sortOrder) {
		nodeList.sort(function(a, b) {
			var aCount = (a instanceof Group) ? a.getVertexList().length : 1;
			var bCount = (b instanceof Group) ? b.getVertexList().length : 1;

			return sortOrder * (aCount - bCount);
		});

		sort.call(this);
	}

	function sort() {
		nodeList.forEach(function(node) {
			node.remove(true);
			nodeListElement.appendChild(node.render());
		});
	}

	function toggleControls() {
		if (nodeList.length > 0) {
			buttonGroup.classList.remove('hidden');
			sortListElement.classList.remove('hidden');
		} else {
			buttonGroup.classList.add('hidden');
			sortListElement.classList.add('hidden');
		}
	}
}