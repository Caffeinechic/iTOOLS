import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-canvas min-h-screen w-full lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,28rem)] xl:grid-cols-[minmax(0,1fr)_30rem]">
      <AuthBrandPanel />

      <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:py-12">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </main>
  );
}
