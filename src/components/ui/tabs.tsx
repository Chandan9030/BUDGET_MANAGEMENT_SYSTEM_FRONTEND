import * as React from "react";

interface TabsProps {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}



const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (value: string) => void;
} | null>(null);

export function Tabs({ defaultValue, className, children }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: TabsListProps) {
  return <div className={className}>{children}</div>;
}

export function TabsTrigger({ value, className = "", children }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error("TabsTrigger must be used within a Tabs component");
  }

  const { activeTab, setActiveTab } = context;
  
  // Core styles that apply to all tabs
  const baseStyle = "px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
  
  // Active tab styles
  const activeStyle = "bg-white text-blue-600 rounded-md shadow-sm";
  
  // Inactive tab styles
  const inactiveStyle = "text-gray-600 hover:text-blue-600 hover:bg-gray-50";
  
  return (
    <button
      className={`${baseStyle} ${activeTab === value ? activeStyle : inactiveStyle} ${className}`}
      onClick={() => setActiveTab(value)}
      type="button"
      role="tab"
      aria-selected={activeTab === value}
      data-state={activeTab === value ? "active" : "inactive"}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className = "", children }: TabsContentProps) {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error("TabsContent must be used within a Tabs component");
  }

  const { activeTab } = context;

  if (activeTab !== value) {
    return null;
  }

  return (
    <div 
      className={`mt-2 focus:outline-none ${className}`} 
      role="tabpanel" 
      tabIndex={0}
      data-state="active"
    >
      {children}
    </div>
  );
}