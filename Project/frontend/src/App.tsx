import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import MainPage from "./pages/MainPage";
import SignupPage from "./pages/SignupPage";
import MyPage from "./pages/MyPage";
import SurveyPage from "./pages/SurveyPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/survey" element={<SurveyPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
