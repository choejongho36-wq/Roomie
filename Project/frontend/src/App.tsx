import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MainPage from "./pages/MainPage";
import SignupPage from "./pages/SignupPage";
import MyPage from "./pages/MyPage";
import SurveyPage from "./pages/SurveyPage";
import SurveyCompletePage from "./pages/SurveyCompletePage";
import RecommendationPage from "./pages/RecommendationPage";
import ProfilePage from "./pages/mypage/ProfilePage";
import EditProfilePage from "./pages/mypage/EditProfilePage";
import ActivityPage from "./pages/mypage/ActivityPage";
import PlaceholderPage from "./pages/mypage/PlaceholderPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/survey/complete" element={<SurveyCompletePage />} />
          <Route path="/recommend" element={<RecommendationPage />} />
          <Route path="/mypage" element={<MyPage />}>
            <Route index element={<ProfilePage />} />
            <Route path="edit" element={<EditProfilePage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="my-activity" element={<PlaceholderPage title="내 활동" />} />
            <Route path="interests" element={<PlaceholderPage title="관심 목록" />} />
            <Route path="chat" element={<PlaceholderPage title="채팅" />} />
            <Route path="notifications" element={<PlaceholderPage title="알림" />} />
            <Route path="settings" element={<PlaceholderPage title="계정 설정" />} />
          </Route>
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
