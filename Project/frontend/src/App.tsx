import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MainPage from "./pages/MainPage";
import SignupPage from "./pages/SignupPage";
import FindIdPage from "./pages/FindIdPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import OAuth2RedirectPage from "./pages/OAuth2RedirectPage";
import CompleteProfilePage from "./pages/CompleteProfilePage";
import MyPageLayout from "./pages/mypage/MyPageLayout";
import SurveyPage from "./pages/survey/SurveyPage";
import SurveyWeightsPage from "./pages/survey/SurveyWeightsPage";
import SurveyCompletePage from "./pages/survey/SurveyCompletePage";
import RecommendationPage from "./pages/RecommendationPage";
import ProfileBoardPage from "./pages/ProfileBoardPage";
import MyProfilePage from "./pages/mypage/MyProfilePage";
import EditProfilePage from "./pages/mypage/EditProfilePage";
import ActivityPage from "./pages/mypage/ActivityPage";
import MyActivityDashboardPage from "./pages/mypage/MyActivityDashboardPage";
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
import MatchedPairPage from "./pages/MatchedPairPage";
import HouseEntryPage from "./pages/house/HouseEntryPage";
import HouseLayout from "./pages/house/HouseLayout";
import HousePage from "./pages/house/HousePage";
import HouseBillsPage from "./pages/house/HouseBillsPage";
import HouseChoresPage from "./pages/house/HouseChoresPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <Navbar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/find-id" element={<FindIdPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/oauth2/redirect" element={<OAuth2RedirectPage />} />
              <Route path="/complete-profile" element={<CompleteProfilePage />} />
              <Route path="/survey" element={<SurveyPage />} />
              <Route path="/survey/weights" element={<SurveyWeightsPage />} />
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
              <Route path="/matched/:id" element={<MatchedPairPage />} />
              <Route path="/house" element={<HouseEntryPage />} />
              <Route path="/house/:id" element={<HouseLayout />}>
                <Route index element={<HousePage />} />
                <Route path="bills" element={<HouseBillsPage />} />
                <Route path="chores" element={<HouseChoresPage />} />
              </Route>
              <Route path="/mypage" element={<MyPageLayout />}>
                <Route index element={<MyProfilePage />} />
                <Route path="edit" element={<EditProfilePage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="my-activity" element={<MyActivityDashboardPage />} />
                <Route path="interests" element={<InterestsPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="settings" element={<PlaceholderPage title="계정 설정" />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;