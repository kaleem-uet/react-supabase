export interface TodoItem {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export type TodoList = TodoItem[];
