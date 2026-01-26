import React, { createContext, useContext, useMemo, useState } from 'react';
import { User } from '../types';

interface AppContextValue {
  users: User[];
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ users: User[]; children: React.ReactNode }> = ({ users, children }) => {
  const [currentUser, setCurrentUser] = useState<User>(users[0]);

  const value = useMemo(() => ({ users, currentUser, setCurrentUser }), [users, currentUser]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
};
