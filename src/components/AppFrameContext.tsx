import { createContext, useContext } from "react";

/** True when a page renders inside the single new app frame (FeaturesApp shell with its sidebar/tab bar).
 *  Legacy nav pieces (BottomNav, AppNavigation, BottomNavigation, MenuDrawer triggers, Matches DesktopLayout)
 *  check this and stay hidden, so there is exactly one nav. */
export const AppFrameContext = createContext(false);
export const useInAppFrame = () => useContext(AppFrameContext);
