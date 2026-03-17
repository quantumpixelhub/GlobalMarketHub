import { LogoPicker } from '@/components/shared/LogoPicker';

export const metadata = {
  title: 'Choose Your Logo | GlobalMarketHub',
  description: 'Select your favorite logo design for GlobalMarketHub',
};

export default function LogoGalleryPage() {
  return (
    <main className="min-h-screen">
      <LogoPicker />
    </main>
  );
}
