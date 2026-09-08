import { redirect } from "next/navigation";

// Root redirects to /pos (authenticated users land in the app shell)
export default function HomePage() {
  redirect("/pos");
}
