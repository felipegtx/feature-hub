import {TodoManagerState} from '../manager';

export function areAllTodosCompleted(todos: TodoManagerState): boolean {
  return todos.allIds.every(id => {
    const todo = todos.byId[id];

    return todo ? todo.completed : false;
  });
}
