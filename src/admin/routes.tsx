import { Route } from "react-router-dom";
import AdminLayout from "./Layout";
import Dashboard from "./Dashboard";
import { EventDetail, EventForm, EventsList } from "./Events";
import { DealForm, DealsList, MemberDetail, Members, Questions } from "./Content";
import { Announcements, SettingsPage, Waitlist } from "./Ops";

/** Mounted inside <Routes> in App.tsx as {adminRoutes}. Replaces legacy /admin only. */
export const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="events" element={<EventsList />} />
    <Route path="events/new" element={<EventForm />} />
    <Route path="events/:id" element={<EventDetail />} />
    <Route path="events/:id/edit" element={<EventForm />} />
    <Route path="deals" element={<DealsList />} />
    <Route path="deals/new" element={<DealForm />} />
    <Route path="deals/:id" element={<DealForm />} />
    <Route path="questions" element={<Questions />} />
    <Route path="members" element={<Members />} />
    <Route path="members/:id" element={<MemberDetail />} />
    <Route path="announcements" element={<Announcements />} />
    <Route path="waitlist" element={<Waitlist />} />
    <Route path="settings" element={<SettingsPage />} />
  </Route>
);
