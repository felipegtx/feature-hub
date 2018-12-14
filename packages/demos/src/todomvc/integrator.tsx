import {FeatureAppManager, FeatureServiceRegistry} from '@feature-hub/core';
import {defineExternals, loadAmdModule} from '@feature-hub/module-loader';
import {FeatureAppLoader} from '@feature-hub/react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {todoManagerDefinition} from './manager';

const registry = new FeatureServiceRegistry();
const manager = new FeatureAppManager(registry, loadAmdModule);

registry.registerProviders([todoManagerDefinition], 's2:todomvc-todo-manager');

defineExternals({react: React});

ReactDOM.render(
  <div>
    <FeatureAppLoader manager={manager} src="feature-app-header.umd.js" />
    <FeatureAppLoader manager={manager} src="feature-app-main.umd.js" />
    <FeatureAppLoader manager={manager} src="feature-app-footer.umd.js" />
  </div>,
  document.querySelector('main')
);
