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
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import BoardListPage from "./pages/board/BoardListPage";
import BoardDetailPage from "./pages/board/BoardDetailPage";
import BoardWritePage from "./pages/board/BoardWritePage";

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
           <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/board" element={<BoardListPage />} />
          <Route path="/board/write" element={<BoardWritePage />} />
          <Route path="/board/edit/:postId" element={<BoardWritePage />} />
          <Route path="/board/:postId" element={<BoardDetailPage />} />
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
