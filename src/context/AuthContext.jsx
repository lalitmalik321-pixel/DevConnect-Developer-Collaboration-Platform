import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("devconnect_user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("devconnect_token");
  });

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);

    localStorage.setItem(
      "devconnect_user",
      JSON.stringify(userData)
    );

    localStorage.setItem(
      "devconnect_token",
      authToken
    );
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("devconnect_user");
    localStorage.removeItem("devconnect_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}