import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/spin?mac=00:00:00:00:00:00&ip=10.10.11.1&sig=dev');
}
