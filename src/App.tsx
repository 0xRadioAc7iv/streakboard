import { useEffect, useState } from "react";
import { supabase } from "./supabase-client";
import Auth from "./components/Auth";
import { Session, User } from "@supabase/supabase-js";
import Page from "./components/Page";

function App() {
  const [_, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const getUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user || null;
  };

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getUser();
      setUser(currentUser);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return <div>{user ? <Page user={user} /> : <Auth />}</div>;
}

export default App;
