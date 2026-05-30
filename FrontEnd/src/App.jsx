import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SangTacPage from './pages/SangTacPage';
import TaiKhoanPage from './pages/TaiKhoanPage';
import TimTruyenPage from './pages/TimTruyenPage';
import ComicReaderPage from './pages/ComicReaderPage';
import ChiTietTruyenPage from './pages/ChiTietTruyenPage';
import AuthorPage from './pages/AuthorPage';
import WalletPage from './pages/WalletPage';
import AdminPage, { DashboardTab, UsersTab, ComicsTab, ChaptersTab, CommentsTab, ReportsTab, AppealsTab, TransactionsTab, WithdrawalsTab } from './pages/AdminPage';
import AdminReportDetailPage from './pages/AdminReportDetailPage';
import AppealPage from './pages/AppealPage';
import LichSuPage from './pages/LichSuPage';
import TuTruyenPage from './pages/TuTruyenPage';
import XepHangPage from './pages/XepHangPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/tim-truyen" element={<TimTruyenPage />} />
      <Route path="/sang-tac" element={<SangTacPage />} />
      <Route path="/doc-truyen/:slug" element={<ComicReaderPage />} />
      <Route path="/doc-truyen/:slug/:chapterId" element={<ComicReaderPage />} />
      <Route path="/chi-tiet-truyen/:slug" element={<ChiTietTruyenPage />} />
      <Route path="/chi-tiet-truyen/:slug/:chapterId" element={<ComicReaderPage />} />
      <Route path="/doc-truyen-chu/:slug" element={<ComicReaderPage />} />
      <Route path="/doc-truyen-chu/:slug/:chapterId" element={<ComicReaderPage />} />
      <Route path="/tai-khoan" element={<TaiKhoanPage />} />
      <Route path="/linh-thach" element={<TaiKhoanPage />} />
      <Route path="/vi-xu" element={<WalletPage />} />
      <Route path="/appeal/:reportId" element={<AppealPage />} />
      <Route path="/tac-gia/:authorName" element={<AuthorPage />} />
      <Route path="/admin" element={<AdminPage />}>
        <Route index element={<DashboardTab />} />
        <Route path="users" element={<UsersTab />} />
        <Route path="comics" element={<ComicsTab />} />
        <Route path="chapters" element={<ChaptersTab />} />
        <Route path="comments" element={<CommentsTab />} />
        <Route path="reports" element={<ReportsTab />} />
        <Route path="reports/:id" element={<AdminReportDetailPage />} />
        <Route path="appeals" element={<AppealsTab />} />
        <Route path="transactions" element={<TransactionsTab />} />
        <Route path="withdrawals" element={<WithdrawalsTab />} />
      </Route>
      <Route path="/lich-su" element={<LichSuPage />} />
      <Route path="/theo-doi" element={<TuTruyenPage />} />
      <Route path="/xep-hang" element={<XepHangPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}