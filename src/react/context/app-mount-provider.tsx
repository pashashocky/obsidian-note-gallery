import { App, Component } from "obsidian";

import { ComponentChildren, createContext } from "preact";
import { useContext } from "preact/hooks";

interface ContextProps {
  app: App;
  sourcePath: string;
  component: Component;
  children: ComponentChildren;
}

const MountContext = createContext<ContextProps | null>(null);

export const useAppMount = () => {
  const value = useContext(MountContext);
  if (value === null) {
    throw new Error("useAppMount() called without a <AppMountProvider /> in the tree.");
  }

  return value;
};

export default function AppMountProvider(props: ContextProps) {
  return (
    <MountContext.Provider value={{ ...props }}>{props.children}</MountContext.Provider>
  );
}
