import { useEffect, useState } from "react";
import GreetingBanner from "../components/greeting-banner";
import { apiGetUser, apiSetUserName, apiClearAll } from "../api";
import { UserProfile } from "../types";

export default function SettingsView(): JSX.Element {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    apiGetUser().then((u) => {
      setUser(u);
      setName(u.name);
    });
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    apiSetUserName(name).then(setUser);
  }

  return (
    <section>
      <GreetingBanner page="settings" />
      <h2>Settings</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="sname">Your name</label>
        <input
          id="sname"
          placeholder="e.g., Alex"
          title="Your display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit" title="Save your profile">
          Save
        </button>
      </form>

      <div>{user ? "Hello, " + user.name : ""}</div>
      <hr />
      <h2>Danger zone</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apiClearAll().then(() => window.location.reload());
        }}
      >
        <button type="submit">Clear all user data</button>
      </form>
    </section>
  );
}
