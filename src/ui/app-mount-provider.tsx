import { App, Component } from "obsidian";

import React, { PropsWithChildren } from "react";

interface ContextProps {
  app: App;
  sourcePath: string;
  component: Component;
}

const MountContext = React.createContext<ContextProps | null>(null);

export const useAppMount = () => {
  const value = React.useContext(MountContext);
  if (value === null) {
    throw new Error("useAppMount() called without a <AppMountProvider /> in the tree.");
  }

  return value;
};

export default function AppMountProvider(props: PropsWithChildren<ContextProps>) {
  return (
    <MountContext.Provider value={{ ...props }}>{props.children}</MountContext.Provider>
  );
}
