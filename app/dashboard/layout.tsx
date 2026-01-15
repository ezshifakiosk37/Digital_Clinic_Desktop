import Sidebar from "./_components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex gap-6 min-h-screen bg-primary">
            <main className="w-120">
                <Sidebar />
            </main>

            <main className="w-full min-h-screen">
                {children}
            </main>
        </div>
    );
}