import React from 'react';
import undom from 'undom';
import test from 'ava';
import reconciled from '.';

const document = undom();

// Utility to serialize undom elements into HTML string, copied from undom's readme and reformatted
const serialize = el => {
	if (el.nodeType === 3) {
		return el.textContent;
	}

	const name = String(el.nodeName).toLowerCase();
	let str = '<' + name;
	let c;
	let i;

	for (i = 0; i < el.attributes.length; i++) {
		str += ' ' + el.attributes[i].name + '="' + el.attributes[i].value + '"';
	}

	str += '>';

	for (i = 0; i < el.childNodes.length; i++) {
		c = serialize(el.childNodes[i]);

		if (c) {
			str += c;
		}
	}

	return str + '</' + name + '>';
};

// Naive reconciler for testing
const reconciler = reconciled({
	createNode: (type, props) => {
		const node = document.createElement(type);

		for (const [key, value] of Object.entries(props)) {
			node.setAttribute(key, value);
		}

		return node;
	},
	createTextNode: text => document.createTextNode(text),
	setTextNodeValue: (node, text) => {
		node.textContent = text;
	},
	appendNode: (parentNode, childNode) => parentNode.appendChild(childNode), // eslint-disable-line unicorn/prefer-node-append
	insertBeforeNode: (parentNode, newChildNode, beforeChildNode) => parentNode.insertBefore(newChildNode, beforeChildNode),
	updateNode: (node, oldProps, newProps) => {
		for (const key of Object.keys(oldProps)) {
			if (newProps[key] === undefined) {
				node.removeAttribute(key);
			}
		}

		for (const [key, value] of Object.entries(newProps)) {
			node.setAttribute(key, value);
		}
	},
	removeNode: (parentNode, childNode) => parentNode.removeChild(childNode)
});

// Utility method to DRY tests up
const render = node => {
	const rootNode = document.createElement('body');
	const tree = reconciler.create(rootNode);
	tree.render(node);

	return {
		serialize: () => serialize(rootNode).replace('<body>', '').replace('</body>', ''),
		rerender: tree.render.bind(tree),
		unmount: tree.unmount.bind(tree)
	};
};

test('render node', t => {
	t.is(render(<div/>).serialize(), '<div></div>');
});

test('render node with props', t => {
	t.is(render(<div id="root"/>).serialize(), '<div id="root"></div>');
});

test('render node with text content', t => {
	t.is(render(<div>Hello</div>).serialize(), '<div>Hello</div>');
});

test('render node with several text nodes', t => {
	t.is(render(<div>Hello, {'Jane'}</div>).serialize(), '<div>Hello, Jane</div>');
});

test('render node with child node', t => {
	t.is(render(<div><span>Hello</span><span>World</span></div>).serialize(), '<div><span>Hello</span><span>World</span></div>');
});

test('render node with mixed text and regular nodes', t => {
	t.is(render(<div>Hello, <span>World</span></div>).serialize(), '<div>Hello, <span>World</span></div>');
});

test('swap node', t => {
	const {serialize, rerender} = render(<div/>);
	t.is(serialize(), '<div></div>');

	rerender(<span/>);
	t.is(serialize(), '<span></span>');
});

test('add node prop', t => {
	const {serialize, rerender} = render(<div/>);
	t.is(serialize(), '<div></div>');

	rerender(<div id="root"/>);
	t.is(serialize(), '<div id="root"></div>');
});

test('change node prop', t => {
	const {serialize, rerender} = render(<div id="old-root"/>);
	t.is(serialize(), '<div id="old-root"></div>');

	rerender(<div id="new-root"/>);
	t.is(serialize(), '<div id="new-root"></div>');
});

test('remove node prop', t => {
	const {serialize, rerender} = render(<div id="root"/>);
	t.is(serialize(), '<div id="root"></div>');

	rerender(<div/>);
	t.is(serialize(), '<div></div>');
});

test('add text node', t => {
	const {serialize, rerender} = render(<div>Hello, {'X'}</div>);
	t.is(serialize(), '<div>Hello, X</div>');

	rerender(<div>Hello, {'X'} and {'Y'}</div>);
	t.is(serialize(), '<div>Hello, X and Y</div>');
});

test('change text node', t => {
	const {serialize, rerender} = render(<div>Hello, {'X'}</div>);
	t.is(serialize(), '<div>Hello, X</div>');

	rerender(<div>Hello, {'Y'}</div>);
	t.is(serialize(), '<div>Hello, Y</div>');
});

test('remove text node', t => {
	const {serialize, rerender} = render(<div>Hello, {'X'}</div>);
	t.is(serialize(), '<div>Hello, X</div>');

	rerender(<div>Hello</div>);
	t.is(serialize(), '<div>Hello</div>');
});

test('add child node', t => {
	const {serialize, rerender} = render(<div><span id="first"/></div>);
	t.is(serialize(), '<div><span id="first"></span></div>');

	rerender(<div><span id="first"/><span id="second"/></div>);
	t.is(serialize(), '<div><span id="first"></span><span id="second"></span></div>');
});

test('insert before child node', t => {
	const {serialize, rerender} = render(<div><span id="first"/><span id="third"/></div>);
	t.is(serialize(), '<div><span id="first"></span><span id="third"></span></div>');

	rerender(<div><span id="first"/><span id="second"/><span id="third"/></div>);
	t.is(serialize(), '<div><span id="first"></span><span id="second"></span><span id="third"></span></div>');
});

test('remove child node', t => {
	const {serialize, rerender} = render(<div><span id="first"/><span id="second"/></div>);
	t.is(serialize(), '<div><span id="first"></span><span id="second"></span></div>');

	rerender(<div><span id="first"/></div>);
	t.is(serialize(), '<div><span id="first"></span></div>');
});
