import { useState, useEffect } from "react";
import TodoList from "./components/TodoList";
import Login from "./components/Login";
import Signup from "./components/Signup";
import supabase from "./utils/supabase-client";

export default function App() {
  const [page, setPage] = useState<"login" | "signup" | "todo">("login");
  const [isLoading, setIsLoading] = useState(true);

  // user email of logined user
  const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error fetching session:", error);
      return null;
    }
    return data.session?.user?.email || null;
  };

  // Check if user is already logged in
  const checkUserLoggedIn = async () => {
    try {
      setIsLoading(true);
      const email = await getSession();
      if (email) {
        setPage("todo");
      } else {
        setPage("login");
      }
    } catch (error) {
      console.error("Error checking user login status:", error);
      setPage("login");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout from TodoList component
  const handleLogout = () => {
    setPage("login");
  };

  // Check user login status on component mount
  useEffect(() => {
    checkUserLoggedIn();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setPage("todo");
      } else if (event === "SIGNED_OUT") {
        setPage("login");
      }
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {page === "login" && (
        <>
          <Login onLogin={() => setPage("todo")} />
          <div className="text-center mt-4">
            <span className="text-gray-600">Don't have an account?</span>
            <button
              className="ml-2 text-blue-600 hover:underline"
              onClick={() => setPage("signup")}
            >
              Sign Up
            </button>
          </div>
        </>
      )}
      {page === "signup" && (
        <>
          <Signup onSignup={() => setPage("todo")} />
          <div className="text-center mt-4">
            <span className="text-gray-600">Already have an account?</span>
            <button
              className="ml-2 text-blue-600 hover:underline"
              onClick={() => setPage("login")}
            >
              Login
            </button>
          </div>
        </>
      )}
      {page === "todo" && <TodoList onLogout={handleLogout} />}
    </div>
  );
}
