import { useEffect, useState } from "react";
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
      <h2>Profile</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="name">Name</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit">Save</button>
      </form>
      <div>{user ? "Hello, " + user.name : ""}</div>
      <hr />
      <h2>Danger zone</h2>
      <form onSubmit={(e) => { e.preventDefault(); apiClearAll().then(() => window.location.reload()); }}>
        <button type="submit">Clear all user data</button>
      </form>
    </section>
  );
}
