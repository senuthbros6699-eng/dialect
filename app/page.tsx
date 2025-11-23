import { redirect } from 'next/navigation';

export default function RootRedirect() {
  // Redirects the root URL to the default community page
  redirect('/c/future-tech');
}