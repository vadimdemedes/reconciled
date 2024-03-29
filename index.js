import {
	// eslint-disable-next-line camelcase
	unstable_scheduleCallback,
	// eslint-disable-next-line camelcase
	unstable_cancelCallback,
} from 'scheduler';
import createReconciler from 'react-reconciler';
import omit from 'lodash.omit';
import ow from 'ow';

const NO_CONTEXT = true;
const noop = () => {};

const reconciled = config => {
	ow(
		config,
		ow.object.exactShape({
			render: ow.optional.function,
			createNode: ow.function,
			createTextNode: ow.function,
			setTextNodeValue: ow.function,
			appendNode: ow.function,
			insertBeforeNode: ow.optional.function,
			updateNode: ow.optional.function,
			removeNode: ow.optional.function,
		}),
	);

	const fullConfig = {
		schedulePassiveEffects: unstable_scheduleCallback, // eslint-disable-line camelcase
		cancelPassiveEffects: unstable_cancelCallback, // eslint-disable-line camelcase
		now: Date.now,
		getRootHostContext: () => NO_CONTEXT,
		prepareForCommit: () => null,
		resetAfterCommit: () => {
			if (typeof config.render === 'function') {
				config.render();
			}
		},
		getChildHostContext: () => NO_CONTEXT,
		shouldSetTextContent: () => false,
		getPublicInstance: instance => instance,
		createInstance: (type, props) => {
			return config.createNode(type, omit(props, 'children'));
		},
		createTextInstance: text => {
			return config.createTextNode(text);
		},
		resetTextContent: node => {
			config.setTextNodeValue(node, '');
		},
		// Append root node to a container
		appendInitialChild: (parentNode, childNode) => {
			config.appendNode(parentNode, childNode);
		},
		appendChild: (parentNode, childNode) => {
			config.appendNode(parentNode, childNode);
		},
		insertBefore: (parentNode, newChildNode, beforeChildNode) => {
			config.insertBeforeNode(parentNode, newChildNode, beforeChildNode);
		},
		finalizeInitialChildren: () => false,
		supportsMutation: true,
		appendChildToContainer: (parentNode, childNode) => {
			config.appendNode(parentNode, childNode);
		},
		insertInContainerBefore: (parentNode, newChildNode, beforeChildNode) => {
			config.insertBeforeNode(parentNode, newChildNode, beforeChildNode);
		},
		removeChildFromContainer: (parentNode, childNode) => {
			config.removeNode(parentNode, childNode);
		},
		prepareUpdate: () => true,
		commitUpdate: (node, updatePayload, type, oldProps, newProps) => {
			config.updateNode(
				node,
				omit(oldProps, 'children'),
				omit(newProps, 'children'),
			);
		},
		commitTextUpdate: (node, oldText, newText) => {
			config.setTextNodeValue(node, newText);
		},
		removeChild: (parentNode, childNode) => {
			config.removeNode(parentNode, childNode);
		},
		clearContainer: container => {
			container.childNodes = [];
		},
	};

	const reconciler = createReconciler(fullConfig);

	return {
		create: rootNode => {
			const container = reconciler.createContainer(rootNode, 0, false, null);

			return {
				render: node => reconciler.updateContainer(node, container, null, noop),
				unmount: () => reconciler.updateContainer(null, container, null, noop),
			};
		},
	};
};

export default reconciled;
