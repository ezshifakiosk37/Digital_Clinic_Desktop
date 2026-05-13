import GlobalCallSidebar from "./components/GlobalCallSidebar";

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalCallSidebar/>
        {children}
    </>
  );
}