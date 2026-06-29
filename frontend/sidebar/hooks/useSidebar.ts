"use client";

import { useSidebarStore } from "../store/sidebarStore";

export function useSidebar() {
  const collapseMode = useSidebarStore((s) => s.collapseMode);
  const setCollapseMode = useSidebarStore((s) => s.setCollapseMode);
  const toggleCollapse = useSidebarStore((s) => s.toggleCollapse);
  const expandedCategories = useSidebarStore((s) => s.expandedCategories);
  const setCategoryExpanded = useSidebarStore((s) => s.setCategoryExpanded);
  const toggleCategory = useSidebarStore((s) => s.toggleCategory);
  const favorites = useSidebarStore((s) => s.favorites);
  const recentPages = useSidebarStore((s) => s.recentPages);
  const toggleFavorite = useSidebarStore((s) => s.toggleFavorite);
  const isFavorite = useSidebarStore((s) => s.isFavorite);
  const addRecent = useSidebarStore((s) => s.addRecent);
  const searchOpen = useSidebarStore((s) => s.searchOpen);
  const setSearchOpen = useSidebarStore((s) => s.setSearchOpen);

  const isExpanded = collapseMode === "expanded";
  const isCompact = collapseMode === "compact";

  const getCategoryExpanded = (categoryId: string, defaultExpanded = true) =>
    expandedCategories[categoryId] ?? defaultExpanded;

  return {
    collapseMode,
    setCollapseMode,
    toggleCollapse,
    isExpanded,
    isCompact,
    expandedCategories,
    getCategoryExpanded,
    toggleCategory,
    setCategoryExpanded,
    favorites,
    recentPages,
    toggleFavorite,
    isFavorite,
    addRecent,
    searchOpen,
    setSearchOpen,
  };
}
