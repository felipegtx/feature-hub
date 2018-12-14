import {DomFeatureApp} from '@feature-hub/react';
import {html, render} from 'lit-html';
import {TodoManagerV1} from '../manager';

export class TodoMvcHeader implements DomFeatureApp {
  public readonly kind = 'react-container';

  public constructor(private readonly todoManager: TodoManagerV1) {}

  public attachTo(container: Element): void {
    const header = html`
      <header class="header">
        <h1>todos</h1>
        <input
          class="new-todo"
          placeholder="What needs to be done?"
          on-keypress="${this.handleKeypress}"
          autofocus
        />
      </header>
    `;

    render(header, container);
  }

  private readonly handleKeypress = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      const input = event.target as HTMLInputElement;
      const title = input.value.trim();

      this.todoManager.add(title);

      input.value = '';
    }
  };
}
