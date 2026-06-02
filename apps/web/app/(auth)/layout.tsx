export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md py-6 sm:py-12">{children}</div>
  );
}
