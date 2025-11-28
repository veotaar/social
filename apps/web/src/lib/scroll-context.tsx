import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";

type ScrollContextType = {
  scrollElementRef: RefObject<HTMLDivElement | null>;
};

const ScrollContext = createContext<ScrollContextType | null>(null);

export function ScrollProvider({ children }: { children: ReactNode }) {
  const scrollElementRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollContext.Provider value={{ scrollElementRef }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScrollContext() {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error("useScrollContext must be used within a ScrollProvider");
  }
  return context;
}

export function ScrollContainer({ children }: { children: ReactNode }) {
  const { scrollElementRef } = useScrollContext();

  return (
    <div
      ref={scrollElementRef}
      className="overflow-y-auto"
      style={{
        contain: "strict",
        willChange: "scroll-position",
      }}
    >
      {children}
    </div>
  );
}
