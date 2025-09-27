import GreetingBanner from "../components/greeting-banner";
import { useNotifications } from "../state";

export default function NotificationsView(): JSX.Element {
  const items = useNotifications();
  return (
    <section>
      <GreetingBanner page="notifications" />
      <h2>Notifications</h2>
      <ul>
        {items.map((i) => (
          <li key={i.id}>
            {i.title} {i.dueDate}
          </li>
        ))}
      </ul>
    </section>
  );
}
