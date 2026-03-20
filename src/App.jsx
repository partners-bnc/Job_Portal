import { Route, Routes } from "react-router-dom";
import Header from "./Component/Header.jsx";
import Hero from "./Component/Hero.jsx";
import SpecializationRole from "./Component/SpecializationRole.jsx";
import TalentBridgeWorks from "./Component/TalentBridgeWorks.tsx";
import WhyChooseUs from "./Component/WhyChooseUs.jsx";
import BigCard from "./Component/BigCard.tsx";
import JobBoard from "./Component/JobBoard.tsx";
import ReadyToHire from "./Component/ReadyToHire.tsx";
import Footer from "./Component/Footer.tsx";
import CandidateJob from "./pages/CandidateJob.jsx";
import JobDetail from "./pages/JobDetail.jsx";
import Employee from "./pages/Employee.jsx";
import ContactUs from "./pages/ContactUs.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminLayout from "./pages/AdminLayout.jsx";
import AdminRoute from "./Component/AdminRoute.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminJobListings from "./pages/admin/AdminJobListings.jsx";
import AdminCandidates from "./pages/admin/AdminCandidates.jsx";

function HomePage() {
  return (
    <div className="min-h-screen bg-[#f7f2ed]">
      <Header />
      <Hero />
      <SpecializationRole />
      <WhyChooseUs />
      <TalentBridgeWorks />
      <BigCard />
      <JobBoard />
      <ReadyToHire />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/candidate-jobs" element={<CandidateJob />} />
      <Route path="/job/:id" element={<JobDetail />} />
      <Route path="/employers" element={<Employee />} />
      <Route path="/contact" element={<ContactUs />} />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="jobs" element={<AdminJobListings />} />
        <Route path="candidates" element={<AdminCandidates />} />
      </Route>
    </Routes>
  );
}
