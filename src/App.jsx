import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import SchedulerPage from "./pages/SchedulerPage";
import ExercisePlannerPage from "./pages/ExercisePlannerPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<SchedulerPage />} />
            <Route path="/planner" element={<ExercisePlannerPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
