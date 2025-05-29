import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  CheckCircle2,
  LogOut,
  User,
} from "lucide-react";
import supabase from "@/utils/supabase-client";

interface TodoItem {
  id: number;
  title: string;
  description: string;
  completed?: boolean;
}

interface TodoListProps {
  onLogout?: () => void;
}

export default function TodoList({ onLogout }: TodoListProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editInput, setEditInput] = useState("");
  const [editDescInput, setEditDescInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // user email of logined user
  const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error fetching session:", error);
      return null;
    }
    return data.session?.user?.email || null;
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setError(null);

      const { error } = await supabase.auth.signOut();

      if (error) {
        setError("Failed to logout. Please try again.");
        console.error("Error logging out:", error);
        return;
      }

      // Clear user data and call onLogout callback
      setUserEmail(null);
      setTodos([]);

      // Call the onLogout callback to navigate back to login
      if (onLogout) {
        onLogout();
      }
    } catch (err) {
      setError("An unexpected error occurred during logout.");
      console.error("Unexpected logout error:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      const email = await getSession();
      if (!email) {
        setError("User not logged in. Please log in to manage todos.");
      } else {
        setUserEmail(email);
      }
      console.log("User email:", email);
    };

    fetchSession();
  }, []);

  const getTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase.from("tasks").select();

      if (error) {
        setError("Failed to fetch todos. Please try again.");
        console.error("Error fetching todos:", error);
        return;
      }

      if (!data) {
        setError("No data returned from server.");
        return;
      }

      const formattedTodos = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
      })) as TodoItem[];

      setTodos(formattedTodos);
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error("Unexpected error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getTodos();
  }, [getTodos]);

  const addTodo = async () => {
    if (!input.trim() || !descInput.trim()) {
      setError("Please fill in both title and description.");
      return;
    }

    try {
      setIsAdding(true);
      setError(null);

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: input.trim(),
          description: descInput.trim(),
          email: userEmail || "temp1@example.com",
        })
        .select();

      if (error) {
        setError("Failed to add todo. Please try again.");
        console.error("Error adding todo:", error);
        return;
      }

      if (!data || data.length === 0) {
        setError("No data returned from server.");
        return;
      }

      const newTodo = data[0] as TodoItem;
      setTodos((prev) => [...prev, newTodo]);
      setInput("");
      setDescInput("");
    } catch (err) {
      setError("An unexpected error occurred while adding todo.");
      console.error("Unexpected error:", err);
    } finally {
      setIsAdding(false);
    }
  };
  

  const toggleTodo = useCallback((id: number) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, []);

  const removeTodo = async (id: number) => {
    try {
      setDeletingId(id);
      setError(null);

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        setError("Failed to delete todo. Please try again.");
        console.error("Error deleting todo:", error);
        return;
      }

      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (err) {
      setError("An unexpected error occurred while deleting todo.");
      console.error("Unexpected error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = useCallback(
    (id: number, title: string, description: string) => {
      setEditingId(id);
      setEditInput(title);
      setEditDescInput(description);
    },
    []
  );

  const saveEdit = async (id: number) => {
    if (!editInput.trim() || !editDescInput.trim()) {
      setError("Please fill in both title and description.");
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      const { data, error } = await supabase
        .from("tasks")
        .update({
          title: editInput.trim(),
          description: editDescInput.trim(),
        })
        .eq("id", id)
        .select();
      

      if (error) {
        setError("Failed to update todo. Please try again.");
        console.error("Error updating todo:", error);
        return;
      }

      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                title: editInput.trim(),
                description: editDescInput.trim(),
              }
            : todo
        )
      );

      cancelEdit();
    } catch (err) {
      setError("An unexpected error occurred while updating todo.");
      console.error("Unexpected error:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditInput("");
    setEditDescInput("");
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, action: () => void) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        action();
      }
      if (e.key === "Escape") {
        cancelEdit();
      }
    },
    [cancelEdit]
  );

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto mt-12">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading todos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto mt-12 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8" />
            Todo List
          </CardTitle>

          {/* User info and logout section */}
          <div className="flex items-center gap-3">
            {userEmail && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{userEmail}</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Logging out...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add Todo Form */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
          <Input
            placeholder="Enter todo title..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, addTodo)}
            className="focus-visible:ring-2 focus-visible:ring-primary"
          />
          <Textarea
            placeholder="Enter description..."
            value={descInput}
            onChange={(e) => setDescInput(e.target.value)}
            rows={2}
            className="resize-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <div className="flex justify-end">
            <Button
              onClick={addTodo}
              disabled={isAdding || !input.trim() || !descInput.trim()}
              className="min-w-[100px]"
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Todo
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Todo List */}
        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No todos yet. Add your first one!</p>
            </div>
          ) : (
            todos.map((todo) => (
              <Card
                key={todo.id}
                className={`transition-all duration-200 ${
                  todo.completed ? "opacity-75" : "hover:shadow-md"
                }`}
              >
                <CardContent className="p-4">
                  {editingId === todo.id ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <Input
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        onKeyDown={(e) =>
                          handleKeyDown(e, () => saveEdit(todo.id))
                        }
                        placeholder="Edit title"
                        autoFocus
                      />
                      <Textarea
                        value={editDescInput}
                        onChange={(e) => setEditDescInput(e.target.value)}
                        placeholder="Edit description"
                        rows={2}
                        className="resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={isUpdating}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveEdit(todo.id)}
                          disabled={
                            isUpdating ||
                            !editInput.trim() ||
                            !editDescInput.trim()
                          }
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className="flex-1 cursor-pointer select-none group"
                        onClick={() => toggleTodo(todo.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 w-5 h-5 rounded-full border-2 transition-all ${
                              todo.completed
                                ? "bg-primary border-primary"
                                : "border-muted-foreground group-hover:border-primary"
                            }`}
                          >
                            {todo.completed && (
                              <Check className="h-3 w-3 text-primary-foreground m-0.5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3
                              className={`text-lg font-semibold transition-all ${
                                todo.completed
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground group-hover:text-primary"
                              }`}
                            >
                              {todo.title}
                            </h3>
                            <p
                              className={`text-sm mt-1 transition-all ${
                                todo.completed
                                  ? "line-through text-muted-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {todo.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {todo.completed && (
                          <Badge variant="secondary" className="text-xs">
                            Completed
                          </Badge>
                        )}
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              startEdit(todo.id, todo.title, todo.description)
                            }
                            disabled={deletingId === todo.id}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTodo(todo.id)}
                            disabled={deletingId === todo.id}
                            className="text-destructive hover:text-destructive"
                          >
                            {deletingId === todo.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
