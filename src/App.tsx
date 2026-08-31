import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { About } from "./pages/About";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";
import { NoteDetail } from "./pages/NoteDetail";
import { Notes } from "./pages/Notes";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Projects } from "./pages/Projects";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:slug" element={<ProjectDetail />} />
        <Route path="notes" element={<Notes />} />
        <Route path="notes/:slug" element={<NoteDetail />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
