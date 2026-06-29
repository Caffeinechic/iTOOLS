import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FavoritePage, RecentPage, SidebarCollapseMode } from "../types/navigation";

interface SidebarState {
  collapseMode: SidebarCollapseMode;
  expandedCategories: Record<string, boolean>;
  favorites: FavoritePage[];
  recentPages: RecentPage[];
  searchOpen: boolean;

  setCollapseMode: (mode: SidebarCollapseMode) => void;
  toggleCollapse: () => void;
  setCategoryExpanded: (categoryId: string, expanded: boolean) => void;
  toggleCategory: (categoryId: string, defaultExpanded?: boolean) => void;
  isCategoryExpanded: (categoryId: string, defaultExpanded?: boolean) => boolean;

  addRecent: (page: Omit<RecentPage, "visitedAt">) => void;
  toggleFavorite: (page: Omit<FavoritePage, "sortOrder">) => void;
  isFavorite: (moduleId: string) => boolean;
  setSearchOpen: (open: boolean) => void;
}

const MAX_RECENT = 20;

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      collapseMode: "expanded",
      expandedCategories: {},
      favorites: [],
      recentPages: [],
      searchOpen: false,

      setCollapseMode: (mode) => set({ collapseMode: mode }),

      toggleCollapse: () => {
        const current = get().collapseMode;
        set({ collapseMode: current === "expanded" ? "compact" : "expanded" });
      },

      setCategoryExpanded: (categoryId, expanded) =>
        set((s) => ({
          expandedCategories: { ...s.expandedCategories, [categoryId]: expanded },
        })),

      toggleCategory: (categoryId, defaultExpanded = true) => {
        const stored = get().expandedCategories[categoryId];
        const expanded = stored !== undefined ? stored : defaultExpanded;
        get().setCategoryExpanded(categoryId, !expanded);
      },

      isCategoryExpanded: (categoryId, defaultExpanded = true) => {
        const stored = get().expandedCategories[categoryId];
        return stored !== undefined ? stored : defaultExpanded;
      },

      addRecent: (page) =>
        set((s) => {
          const filtered = s.recentPages.filter((p) => p.moduleId !== page.moduleId);
          const next: RecentPage[] = [
            { ...page, visitedAt: Date.now() },
            ...filtered,
          ].slice(0, MAX_RECENT);
          return { recentPages: next };
        }),

      toggleFavorite: (page) =>
        set((s) => {
          const exists = s.favorites.some((f) => f.moduleId === page.moduleId);
          if (exists) {
            return { favorites: s.favorites.filter((f) => f.moduleId !== page.moduleId) };
          }
          return {
            favorites: [
              ...s.favorites,
              { ...page, sortOrder: s.favorites.length },
            ],
          };
        }),

      isFavorite: (moduleId) => get().favorites.some((f) => f.moduleId === moduleId),

      setSearchOpen: (open) => set({ searchOpen: open }),
    }),
    {
      name: "itools-sidebar",
      partialize: (s) => ({
        collapseMode: s.collapseMode,
        expandedCategories: s.expandedCategories,
        favorites: s.favorites,
        recentPages: s.recentPages,
      }),
    }
  )
);
