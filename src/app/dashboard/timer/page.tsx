import { redirect } from "next/navigation";

export default function TimerPage() {
  // This route is not needed as the timer functionality is in the dashboard
  // Redirect to the dashboard
  redirect("/dashboard");
}
