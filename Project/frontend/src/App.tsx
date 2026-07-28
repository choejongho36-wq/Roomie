import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MainPage from "./pages/MainPage";
import SignupPage from "./pages/SignupPage";
import OAuth2RedirectPage from "./pages/OAuth2RedirectPage";
<<<<<<< HEAD
import CompleteProfilePage from "./pages/CompleteProfilePage";
=======
import CompleteProfilePage from "./pages/Completeprofilepage";
>>>>>>> origin/RWH
import MyPage from "./pages/MyPage";
import SurveyPage from "./pages/SurveyPage";
import SurveyCompletePage from "./pages/SurveyCompletePage";
import RecommendationPage from "./pages/RecommendationPage";
import ProfileBoardPage from "./pages/ProfileBoardPage";
import ProfilePage from "./pages/mypage/ProfilePage";
import EditProfilePage from "./pages/mypage/EditProfilePage";
import ActivityPage from "./pages/mypage/ActivityPage";
import InterestsPage from "./pages/mypage/InterestsPage";
import ChatPage from "./pages/mypage/ChatPage";
import PlaceholderPage from "./pages/mypage/PlaceholderPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import BoardListPage from "./pages/board/BoardListPage";
import BoardDetailPage from "./pages/board/BoardDetailPage";
import BoardWritePage from "./pages/board/BoardWritePage";
import InquiryListPage from "./pages/inquiry/InquiryListPage";
import InquiryWritePage from "./pages/inquiry/InquiryWritePage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/oauth2/redirect" element={<OAuth2RedirectPage />} />
          <Route path="/complete-profile" element={<CompleteProfilePage />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/survey/complete" element={<SurveyCompletePage />} />
          <Route path="/recommend" element={<RecommendationPage />} />
          <Route path="/profiles" element={<ProfileBoardPage />} />
           <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/board" element={<BoardListPage />} />
          <Route path="/board/write" element={<BoardWritePage />} />
          <Route path="/board/edit/:postId" element={<BoardWritePage />} />
          <Route path="/board/:postId" element={<BoardDetailPage />} />
          <Route path="/inquiry" element={<InquiryListPage />} />
          <Route path="/inquiry/write" element={<InquiryWritePage />} />
          <Route path="/inquiry/edit/:inquiryId" element={<InquiryWritePage />} />
          <Route path="/mypage" element={<MyPage />}>
            <Route index element={<ProfilePage />} />
            <Route path="edit" element={<EditProfilePage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="my-activity" element={<PlaceholderPage title="내 활동" />} />
            <Route path="interests" element={<InterestsPage />} />
            <Route path="chat" element={<ChatPage />} />
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