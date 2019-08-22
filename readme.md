# reconciled [![Build Status](https://travis-ci.org/vadimdemedes/reconciled.svg?branch=master)](https://travis-ci.org/vadimdemedes/reconciled)

> Simple way to build a custom React renderer


## Install

```
$ npm install reconciled
```


## Usage

Here's a minimal version of `react-dom` implemented with `reconciled` without support for updates or events:

```jsx
const reconciled = require('reconciled');

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
  appendNode: (parentNode, childNode) => {
    parentNode.appendChild(childNode);
  }
});

const app = reconciler.create(document.body);
app.render(<h1>Stranger Things</h1>);
app.unmount();
```

[![Edit reconciled-demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/dreamy-hypatia-41w3w?fontsize=14)


## What is this for?

React itself doesn't require a certain environment to run. In simple terms, it only manages components and updates. Then, renderer takes representation of this component tree and displays it somewhere. For example, every React app in the browser uses [react-dom](https://github.com/facebook/react/tree/master/packages/react-dom) renderer. [react-native](https://github.com/facebook/react-native) lets you build mobile native apps with React. [Ink](https://github.com/vadimdemedes/ink) renders your React app in the terminal. There's even [react-360](https://github.com/facebook/react-360) renderer for building VR apps.

Custom React renderers let you render React apps anywhere you want, as long as you can build a custom renderer for it. This is where `reconciled` comes in. There's not a lot of documentation around building custom renderers, so I extracted all my knowledge of building them for [Ink](https://github.com/vadimdemedes/ink) into a simple-to-use module. Enjoy.

I think `reconciled` is a good first step in learning how to make a React renderer. If you notice that reconciled is too limited for your use case, I'd recommend checking out its source code and building your renderer without using `reconciled`.


## API

### reconciled(config)

Create a reconciler with the specified config for your custom renderering. Returns a [reconciler](#reconciler) object. Reconciler is a set of methods that let you synchronize React's state with your custom output (see example above).

#### config

Type: `object`

Methods for manipulating nodes.

##### createNode(type, props)

Create a new node.

###### type

Type: `string`

Name of the node that's being rendered. When rendering `<h1>`, `type` equals `'h1'`.

###### props

Type: `object`

Props to add to the node. When rendering `<input value="abc"/>`, `props` equals `{ value: 'abc' }`.

Example implementation:

```js
const createNode = (type, props) => {
	const node = document.createElement(type);

	for (const [key, value] of Object.entries(props)) {
		node.setAttribute(key, value);
	}

	return node;
};
```

Learn more:

- [document.createElement()](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement)
- [Element.setAttribute()](https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute)

##### createTextNode(text)

Create a new text node. For example, when rendering `<h1>Hello World</h1>`, a text node will be created where `text` equals `'Hello World'`.

###### text

Type: `string`

Value of text node.

Example implementation:

```js
const createTextNode = text => document.createTextNode(text);
```

Learn more:

- [document.createTextNode()](https://developer.mozilla.org/en-US/docs/Web/API/Document/createTextNode)

##### setTextNodeValue(node, text)

Update value of a text node.

###### node

Type: `any`

Text node to update.

###### text

Type: `string`

Text to update in a text node.

Example implementation:

```js
const setTextNodeValue = (node, text) => {
	node.textContent = text;
};
```

Learn more:

- [Node.textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent)

##### appendNode(parentNode, childNode)

Insert a new node to parent node as the last child.

###### parentNode

Type: `any`

Parent node to append child node into.

###### childNode

Type: `any`

Child node to append.

Example implementation:

```js
const appendNode = (parentNode, childNode) => {
	parentNode.appendChild(childNode);
};
```

Learn more:

- [Node.appendChild()](https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild)

##### insertBeforeNode(parentNode, newChildNode, beforeChildNode)

Insert a new node before a certain child node.

###### parentNode

Type: `any`

Parent node to insert child node into.

###### newChildNode

Type: `any`

Node to insert.

###### beforeChildNode

Type: `any`

Node used for reference, so that new node is inserted before this one.

Example implementation:

```js
const insertBeforeNode = (parentNode, newChildNode, beforeChildNode) => {
	parentNode.insertBefore(newChildNode, beforeChildNode);
}
```

Learn more:

- [Node.insertBefore()](https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore)

##### updateNode(node, oldProps, newProps)

Update node with new props.

###### node

Type: `any`

Node to update.

###### oldProps

Type: `object`

Set of old props. Compare `newProps` to this object to figure out which props were removed.

###### newProps

Set of new props.

Example implementation:

```js
const updateNode = (node, oldProps, newProps) => {
	for (const key of Object.keys(oldProps)) {
		if (newProps[key] === undefined) {
			node.removeAttribute(key);
		}
	}

	for (const [key, value] of Object.entries(newProps)) {
		node.setAttribute(key, value);
	}
};
```

Learn more:

- [Element.removeAttribute()](https://developer.mozilla.org/en-US/docs/Web/API/Element/removeAttribute)
- [Element.setAttribute()](https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute)

##### removeNode(parentNode, childNode)

Remove child node from parent node.

###### parentNode

Type: `any`

Parent node.

###### childNode

Type: `any`

Child node.

Example implementation:

```js
const removeNode = (parentNode, childNode) => {
	parentNode.removeChild(childNode);
};
```

Learn more:

- [Node.removeChild()](https://developer.mozilla.org/en-US/docs/Web/API/Node/removeChild)

##### render()

Callback which is called after every change is completed by the reconciler.
Useful for renderers like [Ink](https://github.com/vadimdemedes/ink), which have to build custom output for environment that renderer is built for. In Ink's case, it's terminal, so there's no DOM like in the browser. Use this callback as an indication that there has been a change and UI needs to be updated.

### reconciler

Type: `object`

#### render(node)

Update current node tree with a new node and its children.

##### node

Type: `JSX.Element`

New node to replace the current one with.

Example:

```js
reconciler.render(<h1>Hello Mind Flayer</h1>);
```

#### unmount()

Unmount entire node tree and remove all nodes.
