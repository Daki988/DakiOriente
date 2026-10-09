import { ToastProvider } from "@/components/app/kit";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider><div className="min-h-screen bg-[#f6f8fe]">{children}</div></ToastProvider>;
}
