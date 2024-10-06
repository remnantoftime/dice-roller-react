import { useEffect, useState, createContext, useContext } from "react";
import { auth } from "../configs/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        localStorage.setItem("isLoggedIn", "true");
        user.getIdToken().then((result) => {
          localStorage.setItem(
            "seed",
            result
              .split("")
              .map((char) => char.charCodeAt(0))
              .reduce((total, val) => (total += val)) + Date.now()
          );
        });
      } else {
        setCurrentUser({});
        localStorage.setItem("isLoggedIn", false);
        localStorage.setItem("seed", null);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={currentUser}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within an AuthContextProvider");
  }

  return context;
};

export async function signInWithCreds(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  return auth.signOut();
}
