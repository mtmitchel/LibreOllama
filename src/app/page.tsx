
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
  // Ensure function returns something, even though redirect will prevent rendering.
  return null;
}
