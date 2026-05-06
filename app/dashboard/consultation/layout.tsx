// consultation/layout.tsx
import { CallQueueProvider } from '@/app/_context/CallQueueContext';

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {
  return (
    <CallQueueProvider>
      {children}
    </CallQueueProvider>
  );
}