// consultation/layout.tsx
import { CallDataProvider } from '@/app/_context/CallDataContext';
import { CallQueueProvider } from '@/app/_context/CallQueueContext';

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
        {children}
    </>
  );
}