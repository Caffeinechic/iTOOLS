import type {
  NavCategory,
  NavModule,
  NavigationContext,
  ResolvedCategory,
} from "../types/navigation";
import { buildModuleTree, filterVisibleModules, resolveModuleVisibility } from "./PermissionService";

class NavigationRegistryImpl {
  private categories = new Map<string, NavCategory>();
  private modules = new Map<string, NavModule>();
  private initialized = false;

  registerCategory(category: NavCategory): void {
    this.categories.set(category.id, category);
  }

  registerModule(module: NavModule): void {
    this.modules.set(module.id, module);
  }

  registerModules(modules: NavModule[]): void {
    modules.forEach((m) => this.registerModule(m));
  }

  markInitialized(): void {
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getCategories(): NavCategory[] {
    return [...this.categories.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getModules(): NavModule[] {
    return [...this.modules.values()];
  }

  getRailModules(ctx: NavigationContext): NavModule[] {
    const permCtx = { roleTier: ctx.roleTier };
    return this.getModules()
      .filter((m) => m.rail)
      .filter((m) => resolveModuleVisibility(m, permCtx) !== "hidden")
      .sort((a, b) => (a.railOrder ?? a.sortOrder) - (b.railOrder ?? b.sortOrder));
  }

  resolveNavigation(ctx: NavigationContext): ResolvedCategory[] {
    const allModules = this.getModules();
    const categories = this.getCategories();

    return categories
      .map((category) => {
        const categoryModules = allModules.filter((m) => m.categoryId === category.id);
        const tree = buildModuleTree(categoryModules, ctx);
        return { category, modules: tree };
      })
      .filter((c) => c.modules.length > 0);
  }

  searchModules(query: string, ctx: NavigationContext): NavModule[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return filterVisibleModules(this.getModules(), { roleTier: ctx.roleTier }).filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.keywords?.some((k) => k.toLowerCase().includes(q)) ||
        m.route.toLowerCase().includes(q)
    );
  }
}

export const navigationRegistry = new NavigationRegistryImpl();

export function registerCategory(category: NavCategory): void {
  navigationRegistry.registerCategory(category);
}

export function registerModule(module: NavModule): void {
  navigationRegistry.registerModule(module);
}

export function registerModules(modules: NavModule[]): void {
  navigationRegistry.registerModules(modules);
}
