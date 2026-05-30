import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookOpen, faCoins, faChartBar, faLandmark, faChartLine,
  faEye, faCommentDots, faHourglass, faCircleCheck, faCircleXmark,
  faUsers, faStar, faBook, faLockOpen, faFile, faPenToSquare, faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { uploadImageApi } from '../services/uploadApi';
import { commitChapterDraftApi, deleteDraftChapterApi, deleteCommentAsAuthorApi, deletePublishedChapterApi, deleteStoryApi, getAuthorDraftApi, getAuthorRevenueApi, getAllAuthorRevenueApi, getAuthorMonthlyRevenueApi, getMyComicsApi, getStoryCommentsApi, getStoryStatsApi, publishAuthorDraftApi, publishDraftChapterApi, saveAuthorDraftApi, swapChaptersApi, updateStoryInfoApi, updateStoryStatusApi } from '../services/sangTacApi';
import { getAllMyComicsStatsApi } from '../services/authorAnalyticsApi';
import { getPublishedChapterDetailApi, getPublishedComicDetailApi } from '../services/publicComicApi';
import { requestWithdrawalApi, getWithdrawalRequestsApi } from '../services/walletApi';

const initialTextChapters = [];

const initialComicChapters = [];

function createEmptyTextStory() {
  return {
    title: '',
    slug: '',
    description: '',
    categories: '',
    fontFamily: '',
    fontSize: 18,
    color: '',
    background: '',
    content: '',
    chapterTitle: '',
    chapterPrice: 0,
    coverPreview: null,
    letterSpacing: 0,
  };
}

const fontOptions = [
  // Serif — phù hợp đọc truyện dài, hỗ trợ tiếng Việt tốt
  { name: 'Lora', category: 'Serif' },
    { name: 'Arial', category: 'Sans-serif' },
  ];

function createEmptyComicStory() {
  return {
    title: '',
    slug: '',
    description: '',
    categories: '',
    coverPreview: null,
    chapterTitle: '',
    chapterPrice: 0,
  };
}

function mapTextDraftToStory(draft) {
  return {
    title: draft?.title || '',
    slug: draft?.slug || '',
    description: draft?.description || '',
    fontFamily: draft?.fontFamily || '',
    fontSize: draft?.fontSize || 18,
    color: draft?.color || '',
    background: draft?.background || '',
    content: draft?.content || '',
    chapterTitle: draft?.chapterTitle || '',
    chapterPrice: draft?.chapterPrice ?? 0,
    coverPreview: draft?.coverUrl || null,
    letterSpacing: 0,
  };
}

function toPreviewParagraphs(content) {
  const raw = String(content || '').replace(/\r\n/g, '\n').trim();
  if (!raw) return [];

  return raw
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function autoSplitTextContent(content) {
  const normalized = String(content || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return '';

  const sentenceChunks = normalized.match(/[^.!?]+[.!?]?/g);
  const sentences = (sentenceChunks || [normalized])
    .map((item) => item.trim())
    .filter(Boolean);

  const paragraphs = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(sentences.slice(i, i + 2).join(' '));
  }

  return paragraphs.join('\n\n');
}

function mapComicDraftToStory(draft) {
  return {
    title: draft?.title || '',
    slug: draft?.slug || '',
    description: draft?.description || '',
    coverPreview: draft?.coverUrl || null,
    chapterTitle: draft?.chapterTitle || '',
    chapterPrice: draft?.chapterPrice ?? 0,
  };
}

function normalizeEditorPage(page, index) {
  return {
    id: String(page.id ?? `${page.name || page.fileName || 'page'}-${index}-${Date.now()}`),
    name: page.name || page.fileName || `Trang ${index + 1}`,
    url: page.url || page.imageUrl,
    sortOrder: page.sortOrder ?? index,
  };
}

function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`panel ${className}`.trim()}>
      <div className="panel-head">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action ? <div className="panel-action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ChapterList({ chapters, onAdd, onChange, onRemove, title }) {
  return (
    <Panel
      title={title}
      subtitle="Danh sách chapter đang làm việc"
      action={<button type="button" className="secondary-btn" onClick={onAdd}>+ Thêm chapter</button>}
    >
      <div className="chapter-list">
        {chapters.map((chapter, index) => (
          <div key={chapter.id} className="chapter-item">
            <input
              value={chapter.title || ''}
              onChange={(event) => onChange(index, 'title', event.target.value)}
              placeholder="Tên chapter"
            />
            <div className="chapter-item-row">
              <input
                value={chapter.status || 'Nháp'}
                onChange={(event) => onChange(index, 'status', event.target.value)}
                placeholder="Trạng thái"
              />
              <input
                type="number"
                min="0"
                value={chapter.pages ?? ''}
                onChange={(event) => onChange(index, 'pages', event.target.value === '' ? null : Number(event.target.value))}
                placeholder="Số trang"
              />
              <button type="button" className="chapter-remove-btn" onClick={() => onRemove(index)}>Xóa</button>
            </div>
          </div>
        ))}
        {chapters.length === 0 ? <div className="empty-preview">Chưa có chapter, bấm + Thêm chapter để bắt đầu.</div> : null}
      </div>
    </Panel>
  );
}

function PublishedChapterList({ chapters, labelPrefix, selectedChapterId, onEdit, onDelete, onContinue, onMoveUp, onMoveDown, reorderingChapterId, absoluteStartIndex, totalChapters, deletingChapterId, loading }) {
  if (!chapters || chapters.length === 0) {
    return <div className="empty-preview">Chưa có chapter đã đăng.</div>;
  }

  return (
    <div className="chapter-list">
      {chapters.map((chapter, index) => {
        const isDeleting = deletingChapterId === String(chapter.id);
        const isSelected = String(selectedChapterId) === String(chapter.id);
        const isReordering = reorderingChapterId === chapter.id;
        const absoluteIndex = (absoluteStartIndex ?? 0) + index;
        const canMoveUp = absoluteIndex > 0;
        const canMoveDown = absoluteIndex < (totalChapters ?? chapters.length) - 1;

        return (
          <div key={chapter.id} className={`chapter-item${isSelected ? ' chapter-item--active' : ''}`}>
            <div className="chapter-item-row chapter-item-row--title">
              <strong>{labelPrefix} {chapter.chapterNo} - {chapter.title}</strong>
              {(onMoveUp || onMoveDown) ? (
                <span className="chapter-reorder-btns">
                  <button type="button" className="chapter-reorder-btn" disabled={loading || isDeleting || isReordering || !canMoveUp} onClick={() => onMoveUp?.(chapter.id)} title="Chuyển lên">↑</button>
                  <button type="button" className="chapter-reorder-btn" disabled={loading || isDeleting || isReordering || !canMoveDown} onClick={() => onMoveDown?.(chapter.id)} title="Chuyển xuống">↓</button>
                </span>
              ) : null}
            </div>
            <div className="chapter-item-row" style={{ gridTemplateColumns: onContinue ? '1fr 1fr 1fr' : '1fr 1fr', gap: 8 }}>
              {onContinue ? (
                <button type="button" className="primary-btn" disabled={loading || isDeleting} onClick={() => onContinue(chapter)}>
                  Viết tiếp
                </button>
              ) : null}
              <button type="button" className="secondary-btn" disabled={loading || isDeleting || isReordering} onClick={() => onEdit(chapter.id)}>
                Sửa
              </button>
              <button type="button" className="chapter-remove-btn" disabled={loading || isDeleting || isReordering} onClick={() => onDelete(chapter.id)}>
                {isDeleting ? 'Đang xoá...' : 'Xoá'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DraftChapterList({ chapters, labelPrefix, onContinue, onDelete, loading }) {
  if (!chapters || chapters.length === 0) {
    return <div className="empty-preview">Chưa có chapter nháp.</div>;
  }

  return (
    <div className="chapter-list">
      {chapters.map((chapter, index) => (
        <div key={chapter.id || `${labelPrefix}-${index}`} className="chapter-item">
          <div className="chapter-item-row chapter-item-row--title">
            <strong>{labelPrefix} {index + 1} - {chapter.title || 'Chưa đặt tên'}</strong>
          </div>
          <div className="chapter-item-row chapter-item-row--meta">
            <span>{chapter.status || 'Nháp'}</span>
            <span>{chapter.pages != null ? `${chapter.pages} trang` : 'Chưa có số trang'}</span>
          </div>
          <div className="chapter-item-row chapter-item-row--actions">
            <button type="button" className="secondary-btn" disabled={loading} onClick={() => onContinue(index)}>
              Tiếp tục soạn
            </button>
            <button type="button" className="chapter-remove-btn" disabled={loading} onClick={() => onDelete(index)}>
              Xoá
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SangTacPage() {
  const navigate = useNavigate();
  const goBackToPreviousPage = () => {
    if (viewMode === 'editor') {
      setViewMode('manage');
    } else if (selectedStory !== null) {
      setSelectedStory(null);
      setSelectedComicDetail(null);
    } else {
      navigate(-1);
    }
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') === 'editor' ? 'editor' : 'manage';
  const setViewMode = (mode) => {
    setSearchParams({ view: mode }, { replace: true });
  };
  const [mode, setMode] = useState('text');
  const [textPublishedComic, setTextPublishedComic] = useState(null);
  const [textPublishedLoading, setTextPublishedLoading] = useState(false);
  const [textTargetChapterId, setTextTargetChapterId] = useState('');
  const [textWorkspaceBackup, setTextWorkspaceBackup] = useState(null);
  const [publishedComic, setPublishedComic] = useState(null);
  const [publishedComicLoading, setPublishedComicLoading] = useState(false);

  const [textStory, setTextStory] = useState(createEmptyTextStory());
  const [textChapters, setTextChapters] = useState(initialTextChapters);

  const [comicStory, setComicStory] = useState(createEmptyComicStory());
  const [comicChapters, setComicChapters] = useState(initialComicChapters);
  const [comicPages, setComicPages] = useState([]);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragIndexRef = useRef(null);
  const [comicTargetChapterId, setComicTargetChapterId] = useState('');
  const [comicWorkspaceBackup, setComicWorkspaceBackup] = useState(null);
  const [comicPagesDirty, setComicPagesDirty] = useState(false);
  const [deletingChapterId, setDeletingChapterId] = useState('');
  const [myComics, setMyComics] = useState([]);
  const [myComicsLoading, setMyComicsLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  const [selectedComicDetail, setSelectedComicDetail] = useState(null);
  const [selectedComicDetailLoading, setSelectedComicDetailLoading] = useState(false);
  const [selectedStoryHasDraft, setSelectedStoryHasDraft] = useState(false);
  const [uploading, setUploading] = useState({ textCover: false, comicCover: false, comicPages: false, storyInfoCover: false });
  const [storyInfoEditing, setStoryInfoEditing] = useState(false);
  const [storyInfoForm, setStoryInfoForm] = useState({ title: '', coverUrl: '', description: '', categories: '' });
  const [storyInfoSaving, setStoryInfoSaving] = useState(false);
  const [storyComments, setStoryComments] = useState(null);
  const [storyCommentsLoading, setStoryCommentsLoading] = useState(false);
  const [storyCommentsOpen, setStoryCommentsOpen] = useState(false);
  const [storyRevenue, setStoryRevenue] = useState(null);
  const [storyRevenueLoading, setStoryRevenueLoading] = useState(false);
  const [storyRevenueOpen, setStoryRevenueOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [mainTab, setMainTab] = useState('workspace');
  const [allRevenue, setAllRevenue] = useState(null);
  const [allRevenueLoading, setAllRevenueLoading] = useState(false);
  const [allComicsStats, setAllComicsStats] = useState(null);
  const [allComicsStatsLoading, setAllComicsStatsLoading] = useState(false);
  const [allComicsStatsError, setAllComicsStatsError] = useState(null);
  const [statsSortKey, setStatsSortKey] = useState('totalViews');
  const [revenueSubTab, setRevenueSubTab] = useState('dashboard');
  const [monthlyRevenue, setMonthlyRevenue] = useState(null);
  const [monthlyRevenueLoading, setMonthlyRevenueLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBankInfo, setWithdrawBankInfo] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [expandedComics, setExpandedComics] = useState(new Set());
  const toggleComicExpand = (comicId) => setExpandedComics(prev => {
    const next = new Set(prev);
    if (next.has(comicId)) next.delete(comicId); else next.add(comicId);
    return next;
  });
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawHistory, setWithdrawHistory] = useState(null);
  const [withdrawHistoryLoading, setWithdrawHistoryLoading] = useState(false);
  const [storyStats, setStoryStats] = useState(null);
  const [chapterPage, setChapterPage] = useState(0);
  const [reorderingChapterId, setReorderingChapterId] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const [workspacePublishing, setWorkspacePublishing] = useState(false);
  const [workspaceMessage, setWorkspaceMessage] = useState('');

  const previewStyle = useMemo(() => ({
    fontFamily: textStory.fontFamily || 'Lora',
    fontSize: `${textStory.fontSize || 18}px`,
    color: textStory.color || '#2b2f36',
    background: textStory.background || '#fffaf3',
    letterSpacing: `${textStory.letterSpacing || 0}px`,
  }), [textStory.background, textStory.color, textStory.fontFamily, textStory.fontSize, textStory.letterSpacing]);

  const textPreviewParagraphs = useMemo(() => toPreviewParagraphs(textStory.content), [textStory.content]);

  const currentPublishedComic = mode === 'text' ? textPublishedComic : publishedComic;
  const currentPublishedLoading = mode === 'text' ? textPublishedLoading : publishedComicLoading;
  const currentPublishedChapterCount = currentPublishedComic?.chapters?.length || 0;
  const currentDraftChapters = (() => {
    const draftSlug = mode === 'text' ? (textStory?.slug || '') : (comicStory?.slug || '');
    if (selectedStory) {
      // If a specific story is selected, only show drafts that belong to that story
      return (selectedStory.slug || '') === draftSlug ? (mode === 'text' ? textChapters : comicChapters) : [];
    }
    // No story selected (workspace view): show the workspace draft
    return mode === 'text' ? textChapters : comicChapters;
  })();
  const hasTextDraftData = Boolean(
    (textStory.title || '').trim()
    || (textStory.slug || '').trim()
    || (textStory.chapterTitle || '').trim()
    || (textStory.content || '').trim()
    || textChapters.length > 0
  );
  const hasComicDraftData = Boolean(
    (comicStory.title || '').trim()
    || (comicStory.slug || '').trim()
    || (comicStory.chapterTitle || '').trim()
    || comicChapters.length > 0
    || comicPages.length > 0
  );
  const hasCurrentDraftData = mode === 'text' ? hasTextDraftData : hasComicDraftData;

  const refreshPublishedComic = async (slug) => {
    if (!slug) {
      setPublishedComic(null);
      return;
    }

    setPublishedComicLoading(true);
    try {
      const comicData = await getPublishedComicDetailApi(slug);
      setPublishedComic(comicData);
    } catch (error) {
      setPublishedComic(null);
    } finally {
      setPublishedComicLoading(false);
    }
  };

  const refreshTextPublishedComic = async (slug) => {
    if (!slug) {
      setTextPublishedComic(null);
      return;
    }

    setTextPublishedLoading(true);
    try {
      const comicData = await getPublishedComicDetailApi(slug);
      setTextPublishedComic(comicData);
    } catch (error) {
      setTextPublishedComic(null);
    } finally {
      setTextPublishedLoading(false);
    }
  };

  const loadPublishedTextChapterIntoEditor = async (chapterId) => {
    if (!chapterId) return;

    setUploadMessage('');
    setWorkspaceMessage('');
    setTextWorkspaceBackup({
      story: { ...textStory },
      chapters: textChapters.map((chapter) => ({ ...chapter })),
      targetChapterId: textTargetChapterId,
      publishedComic: textPublishedComic,
    });

    setTextPublishedLoading(true);
    try {
      const chapterData = await getPublishedChapterDetailApi(chapterId);
      setTextTargetChapterId(String(chapterData.id));
      setTextStory((prev) => ({
        ...prev,
        chapterTitle: chapterData.title || prev.chapterTitle,
        content: chapterData.content || '',
      }));
      setWorkspaceMessage(`Dang tai chapter ${chapterData.chapterNo} de chinh sua.`);
      return true;
    } catch (error) {
      setWorkspaceMessage(error.message || 'Khong the tai chapter da dang.');
      return false;
    } finally {
      setTextPublishedLoading(false);
    }
  };

  const restoreTextWorkspace = () => {
    if (!textWorkspaceBackup) return;

    setTextStory(textWorkspaceBackup.story);
    setTextChapters(textWorkspaceBackup.chapters);
    setTextTargetChapterId(textWorkspaceBackup.targetChapterId || '');
    setTextPublishedComic(textWorkspaceBackup.publishedComic || null);
    setTextWorkspaceBackup(null);
    setWorkspaceMessage('Da khoi phuc ban nhap truoc do.');
  };

  const handlePublishedTextChapterSelect = (value) => {
    if (!value) {
      if (textWorkspaceBackup) {
        restoreTextWorkspace();
        return;
      }

      setTextTargetChapterId('');
      return;
    }

    setTextTargetChapterId(value);
  };

  const loadPublishedChapterIntoEditor = async (chapterId) => {
    if (!chapterId) return;

    setUploadMessage('');
    setWorkspaceMessage('');
    setComicWorkspaceBackup({
      story: { ...comicStory },
      chapters: comicChapters.map((chapter) => ({ ...chapter })),
      pages: comicPages.map((page) => ({ ...page })),
      targetChapterId: comicTargetChapterId,
      publishedComic,
    });

    setPublishedComicLoading(true);
    try {
      const chapterData = await getPublishedChapterDetailApi(chapterId);
      setComicTargetChapterId(String(chapterData.id));
      setComicStory((prev) => ({
        ...prev,
        chapterTitle: chapterData.title || prev.chapterTitle,
      }));
      setComicPages(Array.isArray(chapterData.pages)
        ? chapterData.pages.map((page, index) => normalizeEditorPage(page, index))
        : []);
      setWorkspaceMessage(`Dang tai chapter ${chapterData.chapterNo} de chinh sua.`);
      return true;
    } catch (error) {
      setWorkspaceMessage(error.message || 'Khong the tai chapter da dang.');
      return false;
    } finally {
      setPublishedComicLoading(false);
    }
  };

  const continueAfterChapter = (chapter) => {
    const nextNo = chapter.chapterNo + 1;
    const storyMode = selectedStory?.mode || mode;
    const storyTitle = selectedStory?.title || (storyMode === 'text' ? textPublishedComic?.title : publishedComic?.title) || '';
    const storySlug = selectedStory?.slug || (storyMode === 'text' ? textPublishedComic?.slug : publishedComic?.slug) || '';
    const storyCover = selectedStory?.coverUrl || null;
    setMode(storyMode);
    if (storyMode === 'text') {
      setTextTargetChapterId('');
      setTextWorkspaceBackup(null);
      setTextStory({
        ...createEmptyTextStory(),
        title: storyTitle,
        slug: storySlug,
        coverPreview: storyCover,
        chapterTitle: `Chương ${nextNo}`,
      });
    } else {
      setComicTargetChapterId('');
      setComicWorkspaceBackup(null);
      setComicStory({
        ...createEmptyComicStory(),
        title: storyTitle,
        slug: storySlug,
        coverPreview: storyCover,
        chapterTitle: `Chap ${nextNo}`,
      });
      setComicPages([]);
      setComicPagesDirty(false);
    }
    setWorkspaceMessage('');
    setViewMode('editor');
  };

  const openCreateEditor = () => {
    if (hasCurrentDraftData) {
      setWorkspaceMessage('Đang mở lại bản nháp gần nhất của bạn.');
      setViewMode('editor');
      return;
    }

    if (mode === 'text') {
      setTextTargetChapterId('');
      setTextWorkspaceBackup(null);
      setTextStory({
        ...createEmptyTextStory(),
        chapterTitle: `Chương ${(textPublishedComic?.chapters?.length || 0) + 1}`,
      });
    } else {
      setComicTargetChapterId('');
      setComicWorkspaceBackup(null);
      setComicStory({
        ...createEmptyComicStory(),
        chapterTitle: `Chap ${(publishedComic?.chapters?.length || 0) + 1}`,
      });
      setComicPages([]);
      setComicPagesDirty(false);
    }

    setWorkspaceMessage('Dang tao chapter moi. Ban co the nhap noi dung va bam Dang.');
    setViewMode('editor');
  };

  const openChapterEditor = async (chapterId) => {
    const chapterKey = String(chapterId);

    if (mode === 'text' && chapterKey === String(textTargetChapterId) && (textStory.content || '').trim()) {
      setWorkspaceMessage('Dang mo lai ban nhap chapter hien tai.');
      setViewMode('editor');
      return;
    }

    if (mode === 'comic' && chapterKey === String(comicTargetChapterId) && comicPages.length > 0) {
      setWorkspaceMessage('Dang mo lai ban nhap chapter hien tai.');
      setViewMode('editor');
      return;
    }

    const loaded = mode === 'text'
      ? await loadPublishedTextChapterIntoEditor(chapterId)
      : await loadPublishedChapterIntoEditor(chapterId);

    if (loaded) {
      setViewMode('editor');
    }
  };

  const openDraftChapterEditor = (chapterIndex) => {
    const chapter = currentDraftChapters[chapterIndex];
    if (!chapter) return;

    if (mode === 'text') {
      setTextStory((prev) => ({
        ...prev,
        chapterTitle: chapter.title || prev.chapterTitle,
      }));
    } else {
      setComicStory((prev) => ({
        ...prev,
        chapterTitle: chapter.title || prev.chapterTitle,
      }));
    }

    setWorkspaceMessage(`Đang tiếp tục soạn chapter nháp: ${chapter.title || `${mode === 'text' ? 'Chương' : 'Chap'} ${chapterIndex + 1}`}`);
    setViewMode('editor');
  };

  // Enhanced: load draft content/pages into editor when opening a draft chapter
  // so the user can edit the saved draft content immediately.
  const openDraftChapterEditorWithContent = (chapterIndex) => {
    const chapter = currentDraftChapters[chapterIndex];
    if (!chapter) return;

    if (mode === 'text') {
      setTextStory((prev) => ({
        ...prev,
        chapterTitle: chapter.title || prev.chapterTitle,
        content: (chapter.content != null) ? chapter.content : prev.content,
      }));
    } else {
      setComicStory((prev) => ({
        ...prev,
        chapterTitle: chapter.title || prev.chapterTitle,
      }));

      // If draft chapter includes pages, load them into the comic pages editor
      if (Array.isArray(chapter.pages) && chapter.pages.length > 0) {
        setComicPages(chapter.pages.map((p, idx) => normalizeEditorPage(p, idx)));
        setComicPagesDirty(false);
      }
    }

    setWorkspaceMessage(`Đang mở nháp để chỉnh sửa: ${chapter.title || `${mode === 'text' ? 'Chương' : 'Chap'} ${chapterIndex + 1}`}`);
    setViewMode('editor');
  };

  // When we close a selected story (go back to "Tất cả truyện"), restore any workspace backup
  // so the user's unsaved draft is visible again in the workspace list.
  useEffect(() => {
    if (selectedStory === null) {
      if (textWorkspaceBackup) restoreTextWorkspace();
      if (comicWorkspaceBackup) restoreComicWorkspace();
    }
    // only run when selectedStory changes
  }, [selectedStory]);

  const deleteDraftChapter = async (chapterIndex) => {
    const chapter = currentDraftChapters[chapterIndex];
    if (!chapter) return;

    const chapterLabel = chapter.title || `${mode === 'text' ? 'Chương' : 'Chap'} ${chapterIndex + 1}`;
    if (!window.confirm(`Xoá chapter nháp "${chapterLabel}"?`)) {
      return;
    }

    setWorkspaceSaving(true);
    setWorkspaceMessage('');

    try {
      if (mode === 'text') {
        const nextTextChapters = textChapters.filter((_, idx) => idx !== chapterIndex);
        setTextChapters(nextTextChapters);

        const saved = await saveAuthorDraftApi('text', {
          ...textStory,
          coverUrl: textStory.coverPreview,
          targetChapterId: textTargetChapterId ? Number(textTargetChapterId) : null,
          chapters: nextTextChapters,
        });

        setTextChapters(saved?.chapters || nextTextChapters);
        setTextTargetChapterId(saved?.targetChapterId ? String(saved.targetChapterId) : '');
      } else {
        const nextComicChapters = comicChapters.filter((_, idx) => idx !== chapterIndex);
        setComicChapters(nextComicChapters);

        const saved = await saveAuthorDraftApi('comic', {
          ...comicStory,
          coverUrl: comicStory.coverPreview,
          targetChapterId: comicTargetChapterId ? Number(comicTargetChapterId) : null,
          chapters: nextComicChapters,
          pages: comicPages,
        });

        setComicChapters(saved?.chapters || nextComicChapters);
        setComicPages(Array.isArray(saved?.pages) ? saved.pages.map((page, index) => normalizeEditorPage(page, index)) : comicPages);
        setComicTargetChapterId(saved?.targetChapterId ? String(saved.targetChapterId) : '');
        setComicPagesDirty(false);
      }

      setWorkspaceMessage(`Đã xoá chapter nháp: ${chapterLabel}`);
    } catch (error) {
      setWorkspaceMessage(error.message || 'Xoá chapter nháp thất bại.');
    } finally {
      setWorkspaceSaving(false);
    }
  };

  const deletePublishedChapter = async (chapterId) => {
    const chapterKey = String(chapterId);
    if (!window.confirm('Xoá chapter đã đăng này?')) {
      return;
    }

    setDeletingChapterId(chapterKey);
    setWorkspaceMessage('');

    try {
      const deleted = await deletePublishedChapterApi(chapterId);

      if (String(textTargetChapterId) === chapterKey) {
        setTextTargetChapterId('');
        setTextWorkspaceBackup(null);
      }

      if (String(comicTargetChapterId) === chapterKey) {
        setComicTargetChapterId('');
        setComicWorkspaceBackup(null);
      }

      if (deleted?.slug) {
        if (mode === 'text') {
          refreshTextPublishedComic(deleted.slug).catch(() => {});
        } else {
          refreshPublishedComic(deleted.slug).catch(() => {});
        }
        if (selectedStory?.slug === deleted.slug) {
          getPublishedComicDetailApi(deleted.slug)
            .then((detail) => setSelectedComicDetail(detail))
            .catch(() => {});
        }
        setMyComics((prev) => prev.map((c) =>
          c.slug === deleted.slug ? { ...c, chapterCount: Math.max(0, c.chapterCount - 1) } : c
        ));
      }

      setWorkspaceMessage(`Da xoa chapter ${deleted?.chapterNo || ''} thanh cong.`.trim());
    } catch (error) {
      setWorkspaceMessage(error.message || 'Xoa chapter that bai.');
    } finally {
      setDeletingChapterId('');
    }
  };

  const restoreComicWorkspace = () => {
    if (!comicWorkspaceBackup) return;

    setComicStory(comicWorkspaceBackup.story);
    setComicChapters(comicWorkspaceBackup.chapters);
    setComicPages(comicWorkspaceBackup.pages);
    setComicTargetChapterId(comicWorkspaceBackup.targetChapterId || '');
    setPublishedComic(comicWorkspaceBackup.publishedComic || null);
    setComicWorkspaceBackup(null);
    setComicPagesDirty(false);
    setWorkspaceMessage('Da khoi phuc ban nhap truoc do.');
  };

  const handlePublishedChapterSelect = (value) => {
    if (!value) {
      if (comicWorkspaceBackup) {
        restoreComicWorkspace();
        return;
      }

      setComicTargetChapterId('');
      return;
    }

    setComicTargetChapterId(value);
  };

  const handleSelectDraftStory = (draftMode) => {
    setMode(draftMode);
    const draft = draftMode === 'text' ? textStory : comicStory;
    setSelectedStory({
      id: null,
      slug: draft.slug || '',
      title: draft.title || '(Chưa đặt tên)',
      coverUrl: draft.coverPreview || null,
      mode: draftMode,
      chapterCount: 0,
      storyStatus: 'ONGOING',
    });
    setSelectedStoryHasDraft(true);
    setSelectedComicDetail(null);
    setSelectedComicDetailLoading(false);
    setStoryInfoEditing(false);
    setStoryStats(null);
    setStoryComments(null);
    setStoryCommentsOpen(false);
    setStoryRevenue(null);
    setStoryRevenueOpen(false);
    setChapterPage(0);
  };

  const handleUpdateStoryStatus = async (newStatus) => {
    if (!selectedStory) return;
    try {
      await updateStoryStatusApi(selectedStory.slug, newStatus);
      setSelectedStory((prev) => ({ ...prev, storyStatus: newStatus }));
      setMyComics((prev) => prev.map((c) => c.slug === selectedStory.slug ? { ...c, storyStatus: newStatus } : c));
    } catch (error) {
      setWorkspaceMessage(error.message || 'Cập nhật trạng thái thất bại.');
    }
  };

  const openStoryInfoEdit = () => {
    setStoryInfoForm({
      title: selectedStory.title || '',
      coverUrl: selectedStory.coverUrl || '',
      description: selectedStory.description || '',
      categories: selectedStory.categories || '',
    });
    setStoryInfoEditing(true);
  };

  const handleStoryInfoCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading((prev) => ({ ...prev, storyInfoCover: true }));
    try {
      const uploaded = await uploadImageApi(file);
      setStoryInfoForm((prev) => ({ ...prev, coverUrl: uploaded.imageUrl || uploaded.url }));
    } catch (error) {
      setWorkspaceMessage(error.message || 'Upload ảnh bìa thất bại.');
    } finally {
      setUploading((prev) => ({ ...prev, storyInfoCover: false }));
      event.target.value = '';
    }
  };

  const handleSaveStoryInfo = async () => {
    if (!selectedStory || selectedStory.id === null) return;
    if (!storyInfoForm.title.trim()) {
      setWorkspaceMessage('Tên truyện không được để trống.');
      return;
    }
    setStoryInfoSaving(true);
    try {
      await updateStoryInfoApi(selectedStory.slug, storyInfoForm);
      setSelectedStory((prev) => ({ ...prev, title: storyInfoForm.title, coverUrl: storyInfoForm.coverUrl || null, description: storyInfoForm.description, categories: storyInfoForm.categories }));
      setMyComics((prev) => prev.map((c) =>
        c.slug === selectedStory.slug ? { ...c, title: storyInfoForm.title, coverUrl: storyInfoForm.coverUrl || null, categories: storyInfoForm.categories } : c
      ));
      setStoryInfoEditing(false);
      setWorkspaceMessage('Đã cập nhật thông tin truyện.');
    } catch (error) {
      setWorkspaceMessage(error.message || 'Cập nhật thất bại.');
    } finally {
      setStoryInfoSaving(false);
    }
  };

  const handleDeleteStory = async () => {
    if (!selectedStory) return;
    if (!window.confirm(`Bạn có chắc muốn xóa truyện "${selectedStory.title}" không?\nThao tác này không thể hoàn tác.`)) return;
    const title = selectedStory.title;

    if (selectedStory.id === null) {
      const emptyDraft = selectedStory.mode === 'text' ? createEmptyTextStory() : createEmptyComicStory();
      try {
        await saveAuthorDraftApi(selectedStory.mode, { ...emptyDraft, coverUrl: null, chapters: [], pages: [] });
      } catch {}
      if (selectedStory.mode === 'text') {
        setTextStory(createEmptyTextStory());
        setTextChapters([]);
      } else {
        setComicStory(createEmptyComicStory());
        setComicChapters([]);
        setComicPages([]);
        setComicPagesDirty(false);
      }
      setSelectedStoryHasDraft(false);
      setSelectedStory(null);
      setSelectedComicDetail(null);
      setWorkspaceMessage(`Đã xóa truyện nháp "${title}".`);
      return;
    }

    try {
      const deletedSlug = selectedStory.slug;
      const deletedMode = selectedStory.mode;
      await deleteStoryApi(deletedSlug);
      if (deletedMode === 'text' && textStory.slug === deletedSlug) {
        setTextStory(createEmptyTextStory());
        setTextChapters([]);
        setTextTargetChapterId('');
        saveAuthorDraftApi('text', { ...createEmptyTextStory(), coverUrl: null, chapters: [], pages: [] }).catch(() => {});
      } else if (deletedMode === 'comic' && comicStory.slug === deletedSlug) {
        setComicStory(createEmptyComicStory());
        setComicChapters([]);
        setComicPages([]);
        setComicPagesDirty(false);
        setComicTargetChapterId('');
        saveAuthorDraftApi('comic', { ...createEmptyComicStory(), coverUrl: null, chapters: [], pages: [] }).catch(() => {});
      }
      setSelectedStory(null);
      setSelectedComicDetail(null);
      const comics = await getMyComicsApi();
      setMyComics(Array.isArray(comics) ? comics : []);
      setWorkspaceMessage(`Đã xóa truyện "${title}".`);
    } catch (error) {
      window.alert(`Xóa truyện thất bại: ${error.message || 'Lỗi không xác định.'}`);
    }
  };

  const handleSelectStory = async (comic) => {
    // Keep a local backup of current workspace draft before switching stories
    try {
      if (mode === 'text') {
        setTextWorkspaceBackup({
          story: { ...textStory },
          chapters: textChapters.map((c) => ({ ...c })),
          targetChapterId: textTargetChapterId,
          publishedComic: textPublishedComic,
        });
      } else {
        setComicWorkspaceBackup({
          story: { ...comicStory },
          chapters: comicChapters.map((c) => ({ ...c })),
          pages: comicPages.map((p) => ({ ...p })),
          targetChapterId: comicTargetChapterId,
          publishedComic,
        });
      }
    } catch (err) {
      // ignore backup errors
    }

    const hasDraft = comic.mode === 'text'
      ? (textStory.slug === comic.slug && (
          Boolean((textStory.chapterTitle || '').trim() || (textStory.content || '').trim())
          || textChapters.length > 0
        ))
      : (comicStory.slug === comic.slug && (
          Boolean((comicStory.chapterTitle || '').trim() || comicPages.length > 0)
          || comicChapters.length > 0
        ));

    setMode(comic.mode);
    setSelectedStory(comic);
    setSelectedStoryHasDraft(hasDraft);
    setSelectedComicDetail(null);
    setSelectedComicDetailLoading(true);
    setStoryInfoEditing(false);
    setStoryStats(null);
    setChapterPage(0);
    if (comic.mode === 'text') {
      const keepDraft = textStory?.slug === comic.slug;
      setTextStory((prev) => ({ ...(keepDraft ? prev : createEmptyTextStory()), title: comic.title, slug: comic.slug, coverPreview: comic.coverUrl || (prev && prev.coverPreview) }));
    } else {
      const keepDraft = comicStory?.slug === comic.slug;
      setComicStory((prev) => ({ ...(keepDraft ? prev : createEmptyComicStory()), title: comic.title, slug: comic.slug, coverPreview: comic.coverUrl || (prev && prev.coverPreview) }));
    }
    try {
      const [detail] = await Promise.all([
        getPublishedComicDetailApi(comic.slug),
        getStoryStatsApi(comic.slug).then(setStoryStats).catch(() => {}),
      ]);
      setSelectedComicDetail(detail);
      if (comic.mode === 'text') setTextPublishedComic(detail);
      else setPublishedComic(detail);
    } catch {
      setSelectedComicDetail(null);
    } finally {
      setSelectedComicDetailLoading(false);
    }
  };

  const handleMoveChapter = async (chapterId, direction) => {
    const chapters = selectedComicDetail?.chapters || [];
    const idx = chapters.findIndex((c) => c.id === chapterId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= chapters.length) return;
    setReorderingChapterId(chapterId);
    try {
      await swapChaptersApi(chapterId, chapters[swapIdx].id);
      const detail = await getPublishedComicDetailApi(selectedStory.slug);
      setSelectedComicDetail(detail);
      if (selectedStory.mode === 'text') setTextPublishedComic(detail);
      else setPublishedComic(detail);
    } catch (error) {
      setWorkspaceMessage(error.message || 'Đổi thứ tự chapter thất bại.');
    } finally {
      setReorderingChapterId(null);
    }
  };

  const handleWriteNewChapterForStory = async (story) => {
    const hasWorkspaceContent = story.mode === 'text'
      ? ((textStory.chapterTitle || '').trim() || (textStory.content || '').trim())
      : ((comicStory.chapterTitle || '').trim() || comicPages.length > 0);

    if (hasWorkspaceContent) {
      if (!window.confirm('Lưu chapter đang soạn vào hàng chờ nháp trước khi viết chapter mới?')) return;
      try {
        setWorkspaceSaving(true);
        await saveDraft(story.mode);
        const updated = await commitChapterDraftApi(story.mode);
        if (story.mode === 'comic') {
          setComicChapters(Array.isArray(updated?.chapters) ? updated.chapters : []);
          setComicPages([]);
          setComicPagesDirty(false);
        } else {
          setTextChapters(Array.isArray(updated?.chapters) ? updated.chapters : []);
        }
      } catch (e) {
        setWorkspaceMessage(e.message || 'Lưu nháp thất bại.');
        setWorkspaceSaving(false);
        return;
      } finally {
        setWorkspaceSaving(false);
      }
    }

    setMode(story.mode);
    const publishedCount = selectedComicDetail?.chapters?.length ?? story.chapterCount ?? 0;
    const draftCount = story.mode === 'text' ? textChapters.length : comicChapters.length;
    const chapterCount = publishedCount + draftCount;
    if (story.mode === 'text') {
      setTextTargetChapterId('');
      setTextWorkspaceBackup(null);
      setTextStory({
        ...createEmptyTextStory(),
        title: story.title,
        slug: story.slug,
        coverPreview: story.coverUrl || null,
        chapterTitle: `Chương ${chapterCount + 1}`,
      });
    } else {
      setComicTargetChapterId('');
      setComicWorkspaceBackup(null);
      setComicStory({
        ...createEmptyComicStory(),
        title: story.title,
        slug: story.slug,
        coverPreview: story.coverUrl || null,
        chapterTitle: `Chap ${chapterCount + 1}`,
      });
      setComicPages([]);
      setComicPagesDirty(false);
    }
    setSelectedStoryHasDraft(true);
    setWorkspaceMessage('');
    setViewMode('editor');
  };

  const handlePublishDraftChapterById = async (draftChapterId) => {
    if (!selectedStory) return;
    if (!window.confirm('Đăng chapter nháp này ngay bây giờ?')) return;
    setWorkspacePublishing(true);
    setWorkspaceMessage('');
    try {
      const published = await publishDraftChapterApi(selectedStory.mode, draftChapterId, null);
      if (selectedStory.mode === 'comic') {
        setComicChapters((prev) => prev.filter((c) => c.id !== draftChapterId));
      } else {
        setTextChapters((prev) => prev.filter((c) => c.id !== draftChapterId));
      }
      if (published?.slug) {
        refreshPublishedComic(published.slug).catch(() => {});
        getMyComicsApi().then((comics) => setMyComics(Array.isArray(comics) ? comics : [])).catch(() => {});
      }
      setWorkspaceMessage(`Đã đăng thành công: ${published?.chapterTitle || ''}`);
    } catch (error) {
      setWorkspaceMessage(error.message || 'Đăng chapter thất bại.');
    } finally {
      setWorkspacePublishing(false);
    }
  };

  const handleDeleteDraftChapterById = async (draftChapterId) => {
    if (!selectedStory) return;
    if (!window.confirm('Xoá chapter nháp này? Dữ liệu sẽ mất vĩnh viễn.')) return;
    try {
      const updated = await deleteDraftChapterApi(selectedStory.mode, draftChapterId);
      if (selectedStory.mode === 'comic') {
        setComicChapters(Array.isArray(updated?.chapters) ? updated.chapters : []);
      } else {
        setTextChapters(Array.isArray(updated?.chapters) ? updated.chapters : []);
      }
      setWorkspaceMessage('Đã xoá chapter nháp.');
    } catch (error) {
      setWorkspaceMessage(error.message || 'Xoá thất bại.');
    }
  };

  const handleCreateNewStory = () => {
    setSelectedStory(null);
    setSelectedComicDetail(null);
    if (mode === 'text') {
      setTextTargetChapterId('');
      setTextWorkspaceBackup(null);
      setTextStory(createEmptyTextStory());
      setTextChapters([]);
      setTextPublishedComic(null);
    } else {
      setComicTargetChapterId('');
      setComicWorkspaceBackup(null);
      setComicStory(createEmptyComicStory());
      setComicChapters([]);
      setComicPages([]);
      setComicPagesDirty(false);
      setPublishedComic(null);
    }
    setWorkspaceMessage('');
    setViewMode('editor');
  };

  useEffect(() => {
    let mounted = true;

    Promise.all([getAuthorDraftApi('text'), getAuthorDraftApi('comic')])
      .then(([textDraft, comicDraft]) => {
        if (!mounted) return;

        setTextStory(mapTextDraftToStory(textDraft));
        setTextChapters(Array.isArray(textDraft?.chapters) ? textDraft.chapters : []);
        setTextTargetChapterId(textDraft?.targetChapterId ? String(textDraft.targetChapterId) : '');

        if (textDraft?.slug) {
          refreshTextPublishedComic(textDraft.slug).catch(() => {});
        }

        setComicStory(mapComicDraftToStory(comicDraft));
        setComicChapters(Array.isArray(comicDraft?.chapters) ? comicDraft.chapters : []);
        setComicPages(Array.isArray(comicDraft?.pages) ? comicDraft.pages : []);
        setComicTargetChapterId(comicDraft?.targetChapterId ? String(comicDraft.targetChapterId) : '');
        setComicPagesDirty(false);

        if (comicDraft?.slug) {
          refreshPublishedComic(comicDraft.slug).catch(() => {});
        }
      })
      .catch((error) => {
        if (!mounted) return;
        setWorkspaceMessage(error.message || 'Khong the tai du lieu workspace.');
      })
      .finally(() => {
        if (!mounted) return;
        setWorkspaceLoading(false);
      });

    getMyComicsApi()
      .then((comics) => { if (mounted) setMyComics(Array.isArray(comics) ? comics : []); })
      .catch(() => {})
      .finally(() => { if (mounted) setMyComicsLoading(false); });

    return () => {
      mounted = false;
    };
  }, []);

  const saveDraft = async (targetMode) => {
    setWorkspaceSaving(true);
    setWorkspaceMessage('');
    try {
      const payload = targetMode === 'text'
        ? {
            ...textStory,
            coverUrl: textStory.coverPreview,
            targetChapterId: textTargetChapterId ? Number(textTargetChapterId) : null,
            chapters: textChapters,
          }
        : {
            ...comicStory,
            coverUrl: comicStory.coverPreview,
            targetChapterId: comicTargetChapterId ? Number(comicTargetChapterId) : null,
            chapters: comicChapters,
            pages: comicPages,
          };

      const saved = await saveAuthorDraftApi(targetMode, payload);
      if (targetMode === 'text') {
        setTextChapters(saved?.chapters || []);
        setTextTargetChapterId(saved?.targetChapterId ? String(saved.targetChapterId) : '');
      } else {
        setComicChapters(saved?.chapters || []);
        setComicPages(Array.isArray(saved?.pages) ? saved.pages.map((page, index) => normalizeEditorPage(page, index)) : []);
        setComicTargetChapterId(saved?.targetChapterId ? String(saved.targetChapterId) : '');
        setComicPagesDirty(false);
      }
      setWorkspaceMessage('Da luu ban nhap thanh cong.');
      return saved;
    } catch (error) {
      setWorkspaceMessage(error.message || 'Luu ban nhap that bai.');
      throw error;
    } finally {
      setWorkspaceSaving(false);
    }
  };

  const publishDraft = async () => {
    setWorkspacePublishing(true);
    setWorkspaceMessage('');

    try {
      await saveDraft(mode);
      const published = await publishAuthorDraftApi(mode, scheduledAt || null);

      if (mode === 'comic' && published?.slug && published?.chapterId) {
        if (comicStory.categories?.trim()) {
          updateStoryInfoApi(published.slug, {
            title: comicStory.title,
            coverUrl: comicStory.coverPreview || null,
            description: comicStory.description || '',
            categories: comicStory.categories,
          }).catch(() => {});
        }
        setComicTargetChapterId('');
        setComicWorkspaceBackup(null);
        setComicStory((prev) => ({ ...prev, chapterTitle: '' }));
        setComicPages([]);
        setComicPagesDirty(false);
        setSelectedStoryHasDraft(false);
        // Clear chapter draft on backend so it doesn't reappear after reload
        saveAuthorDraftApi('comic', {
          ...comicStory,
          coverUrl: comicStory.coverPreview,
          chapterTitle: '',
          targetChapterId: null,
          chapters: [],
          pages: [],
        }).catch(() => {});
        refreshPublishedComic(published.slug).catch(() => {});
        getMyComicsApi().then((comics) => setMyComics(Array.isArray(comics) ? comics : [])).catch(() => {});
        setWorkspaceMessage(scheduledAt ? `Đã hẹn giờ đăng: ${published.chapterTitle}` : `Đã đăng thành công: ${published.chapterTitle}`);
        setScheduledAt('');
        setViewMode('manage');
      } else if (mode === 'text' && published?.slug && published?.chapterId) {
        if (textStory.categories?.trim()) {
          updateStoryInfoApi(published.slug, {
            title: textStory.title,
            coverUrl: textStory.coverPreview || null,
            description: textStory.description || '',
            categories: textStory.categories,
          }).catch(() => {});
        }
        setTextTargetChapterId('');
        setTextWorkspaceBackup(null);
        setTextStory((prev) => ({ ...prev, chapterTitle: '', content: '' }));
        setSelectedStoryHasDraft(false);
        // Clear chapter draft on backend so it doesn't reappear after reload
        saveAuthorDraftApi('text', {
          ...textStory,
          coverUrl: textStory.coverPreview,
          chapterTitle: '',
          content: '',
          targetChapterId: null,
          chapters: [],
          pages: [],
        }).catch(() => {});
        refreshTextPublishedComic(published.slug).catch(() => {});
        getMyComicsApi().then((comics) => setMyComics(Array.isArray(comics) ? comics : [])).catch(() => {});
        setWorkspaceMessage(scheduledAt ? `Đã hẹn giờ đăng: ${published.chapterTitle}` : `Đã đăng thành công: ${published.chapterTitle}`);
        setScheduledAt('');
        setViewMode('manage');
      } else {
        setWorkspaceMessage('Đã đăng thành công.');
        setScheduledAt('');
        setViewMode('manage');
      }
    } catch (error) {
      setWorkspaceMessage(error.message || 'Dang that bai.');
    } finally {
      setWorkspacePublishing(false);
    }
  };

  const handleTextStoryChange = (field) => async (event) => {
    const { value, files } = event.target;
    if (field === 'coverPreview') {
      const file = files?.[0];
      if (!file) return;
      setUploadMessage('');
      setUploading((prev) => ({ ...prev, textCover: true }));
      try {
        const uploaded = await uploadImageApi(file);
        setTextStory((prev) => ({ ...prev, coverPreview: uploaded.imageUrl || uploaded.url }));
      } catch (error) {
        setUploadMessage(error.message || 'Upload anh bia that bai.');
      } finally {
        setUploading((prev) => ({ ...prev, textCover: false }));
      }
      return;
    }

    const nextValue = field === 'fontSize' || field === 'letterSpacing' ? Number(value) : value;
    setTextStory((prev) => ({ ...prev, [field]: nextValue }));
    if (field === 'slug') {
      setTextPublishedComic(null);
      setTextTargetChapterId('');
      setTextWorkspaceBackup(null);
    }
  };

  const applyAutoParagraphForText = () => {
    setTextStory((prev) => ({
      ...prev,
      content: autoSplitTextContent(prev.content),
    }));
    setWorkspaceMessage('Da tu tach noi dung thanh cac doan de de doc hon.');
  };

  const handleComicStoryChange = (field) => async (event) => {
    const { value, files } = event.target;
    if (field === 'coverPreview') {
      const file = files?.[0];
      if (!file) return;
      setUploadMessage('');
      setUploading((prev) => ({ ...prev, comicCover: true }));
      try {
        const uploaded = await uploadImageApi(file);
        setComicStory((prev) => ({ ...prev, coverPreview: uploaded.imageUrl || uploaded.url }));
      } catch (error) {
        setUploadMessage(error.message || 'Upload anh bia that bai.');
      } finally {
        setUploading((prev) => ({ ...prev, comicCover: false }));
      }
      return;
    }

    setComicStory((prev) => ({ ...prev, [field]: value }));
    if (field === 'slug') {
      setPublishedComic(null);
      setComicTargetChapterId('');
    }
  };

  const handleComicPagesUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setUploadMessage('');
    setUploading((prev) => ({ ...prev, comicPages: true }));

    try {
      const uploadedResults = await Promise.all(files.map((file) => uploadImageApi(file)));
      const uploadedPages = uploadedResults.map((result, index) => ({
        id: `${files[index].name}-${index}-${Date.now()}`,
        name: files[index].name,
        url: result.imageUrl || result.url,
      }));
      setComicPages((prev) => [...prev, ...uploadedPages]);
      setComicPagesDirty(true);
      event.target.value = '';
    } catch (error) {
      setUploadMessage(error.message || 'Upload anh trang that bai.');
    } finally {
      setUploading((prev) => ({ ...prev, comicPages: false }));
    }
  };

  const addTextChapter = () => {
    setTextChapters((prev) => [
      { id: Date.now(), title: `Chương ${prev.length + 1}`, status: 'Nháp' },
      ...prev,
    ]);
  };

  const addComicChapter = () => {
    setComicChapters((prev) => [
      { id: Date.now(), title: comicStory.chapterTitle || `Chap ${prev.length + 1}`, pages: comicPages.length || 0, status: 'Nháp' },
      ...prev,
    ]);
    setComicPages([]);
    setComicPagesDirty(false);
  };

  const updateTextChapter = (index, field, value) => {
    setTextChapters((prev) => prev.map((chapter, idx) => (idx === index ? { ...chapter, [field]: value } : chapter)));
  };

  const updateComicChapter = (index, field, value) => {
    setComicChapters((prev) => prev.map((chapter, idx) => (idx === index ? { ...chapter, [field]: value } : chapter)));
  };

  const removeTextChapter = (index) => {
    setTextChapters((prev) => prev.filter((_, idx) => idx !== index));
  };

  const removeComicChapter = (index) => {
    setComicChapters((prev) => prev.filter((_, idx) => idx !== index));
  };

  const removeComicPage = (index) => {
    setComicPages((prev) => prev.filter((_, idx) => idx !== index));
    setComicPagesDirty(true);
  };

  const handlePageDragStart = (index) => {
    dragIndexRef.current = index;
  };

  const handlePageDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndexRef.current !== null && dragIndexRef.current !== index) {
      setDragOverIndex(index);
    }
  };

  const handlePageDrop = (index) => {
    const from = dragIndexRef.current;
    if (from === null || from === index) {
      dragIndexRef.current = null;
      setDragOverIndex(null);
      return;
    }
    setComicPages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setComicPagesDirty(true);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handlePageDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const replaceComicPage = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadMessage('');
    setUploading((prev) => ({ ...prev, comicPages: true }));
    try {
      const uploaded = await uploadImageApi(file);
      setComicPages((prev) => prev.map((page, idx) => (
        idx === index
          ? { ...page, id: `${file.name}-${index}-${Date.now()}`, name: file.name, url: uploaded.imageUrl || uploaded.url }
          : page
      )));
      setComicPagesDirty(true);
      event.target.value = '';
    } catch (error) {
      setUploadMessage(error.message || 'Thay anh that bai.');
    } finally {
      setUploading((prev) => ({ ...prev, comicPages: false }));
    }
  };

  const saveComicPageChanges = async () => {
    try {
      await saveDraft('comic');
      setWorkspaceMessage('Da luu thay doi anh chapter.');
    } catch {
      // saveDraft already sets workspace message on error.
    }
  };

  return (
    <div className="page sangtac-page">
      <Header />
      <div className="container">
        <main className="sangtac-main">
          <div className="breadcrumb breadcrumb--small">
            <Link to="/">Trang chủ</Link>
            <span>»</span>
            <span>Sáng tác</span>
          </div>

          <section className="workspace-header">
            <div className="workspace-header-intro">
              <p className="workspace-kicker">Dành cho tác giả</p>
              <h1>Workspace sáng tác truyện</h1>
              <p>
                Một giao diện gọn hơn để viết truyện chữ, quản lý truyện hình, upload ảnh và theo dõi chapter.
              </p>
              <div className="workspace-main-tabs">
                <button
                  type="button"
                  className={`workspace-main-tab${mainTab === 'workspace' ? ' active' : ''}`}
                  onClick={() => setMainTab('workspace')}
                >
                  <FontAwesomeIcon icon={faBookOpen} /> Workspace
                </button>
                <button
                  type="button"
                  className={`workspace-main-tab${mainTab === 'revenue' ? ' active' : ''}`}
                  onClick={() => {
                    setMainTab('revenue');
                    setRevenueSubTab('dashboard');
                    if (allRevenue === null) {
                      setAllRevenueLoading(true);
                      getAllAuthorRevenueApi()
                        .then((data) => setAllRevenue(data))
                        .catch(() => setAllRevenue({ totalRevenue: 0, comics: [] }))
                        .finally(() => setAllRevenueLoading(false));
                    }
                    if (monthlyRevenue === null) {
                      setMonthlyRevenueLoading(true);
                      getAuthorMonthlyRevenueApi()
                        .then((data) => setMonthlyRevenue(Array.isArray(data) ? data : []))
                        .catch(() => setMonthlyRevenue([]))
                        .finally(() => setMonthlyRevenueLoading(false));
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faCoins} /> Doanh thu
                </button>
                <button
                  type="button"
                  className={`workspace-main-tab${mainTab === 'analytics' ? ' active' : ''}`}
                  onClick={() => {
                    setMainTab('analytics');
                    if (allComicsStats === null && !allComicsStatsError) {
                      setAllComicsStatsLoading(true);
                      setAllComicsStatsError(null);
                      getAllMyComicsStatsApi()
                        .then((data) => { setAllComicsStats(Array.isArray(data) ? data : []); })
                        .catch((err) => { setAllComicsStatsError(err.message || 'Lỗi tải thống kê'); setAllComicsStats([]); })
                        .finally(() => setAllComicsStatsLoading(false));
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faChartBar} /> Thống kê
                </button>
              </div>
              <div className="workspace-header-back">
                <button
                  type="button"
                  className="workspace-back-link"
                  onClick={goBackToPreviousPage}
                >
                  ← Quay lại trang trước
                </button>
              </div>
            </div>

            <div className="workspace-actions">
              {viewMode === 'editor' ? (
                <>
                  <div className="schedule-row">
                    <label htmlFor="scheduled-at" className="schedule-label">Hẹn giờ đăng</label>
                    <input
                      id="scheduled-at"
                      type="datetime-local"
                      className="schedule-input"
                      value={scheduledAt}
                      min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                    {scheduledAt ? (
                      <button type="button" className="schedule-clear-btn" onClick={() => setScheduledAt('')}>×</button>
                    ) : null}
                  </div>
                  <div className="action-row">
                    <button
                      type="button"
                      className="ghost-btn"
                      disabled={workspaceSaving || workspacePublishing || workspaceLoading}
                      onClick={() => saveDraft(mode)}
                    >
                      {workspaceSaving ? 'Dang luu...' : 'Lưu nháp'}
                    </button>
                    <button
                      type="button"
                      className="primary-btn"
                      disabled={workspaceSaving || workspacePublishing || workspaceLoading}
                      onClick={publishDraft}
                    >
                      {workspacePublishing ? 'Dang dang...' : scheduledAt ? 'Hẹn giờ đăng' : 'Đăng'}
                    </button>
                  </div>
                </>
              ) : null}
            </div>

            <div className="workspace-mode-switch">
              <div className="workspace-toggle workspace-toggle--hero">
                <button type="button" className={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')}>Truyện chữ</button>
                <button type="button" className={mode === 'comic' ? 'active' : ''} onClick={() => setMode('comic')}>Truyện hình</button>
              </div>
            </div>
          </section>

          {uploadMessage ? <div className="tip-box">{uploadMessage}</div> : null}
          {workspaceMessage ? <div className="tip-box">{workspaceMessage}</div> : null}

          {mainTab === 'revenue' ? (
            <section className="revenue-dashboard">
              <div className="revenue-dashboard-header">
                <h2 className="revenue-dashboard-title">Quản lý doanh thu</h2>
              </div>

              <div className="revenue-subtabs">
                <button
                  type="button"
                  className={`revenue-subtab${revenueSubTab === 'dashboard' ? ' active' : ''}`}
                  onClick={() => {
                    setRevenueSubTab('dashboard');
                    if (allRevenue === null) {
                      setAllRevenueLoading(true);
                      getAllAuthorRevenueApi()
                        .then((data) => setAllRevenue(data))
                        .catch(() => setAllRevenue({ totalRevenue: 0, comics: [] }))
                        .finally(() => setAllRevenueLoading(false));
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faCoins} /> Bảng doanh thu
                </button>
                <button
                  type="button"
                  className={`revenue-subtab${revenueSubTab === 'withdraw' ? ' active' : ''}`}
                  onClick={() => {
                    setRevenueSubTab('withdraw');
                    if (withdrawHistory === null) {
                      setWithdrawHistoryLoading(true);
                      getWithdrawalRequestsApi()
                        .then((data) => setWithdrawHistory(data))
                        .catch(() => setWithdrawHistory({ data: [], total: 0 }))
                        .finally(() => setWithdrawHistoryLoading(false));
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faLandmark} /> Yêu cầu rút tiền
                </button>
              </div>

              {revenueSubTab === 'withdraw' ? (
                <div className="withdraw-section">
                  <div className="withdraw-form-card">
                    <h3 className="withdraw-form-title">Gửi yêu cầu rút tiền</h3>
                    <p className="withdraw-form-note">
                      Doanh thu của bạn sẽ được chuyển về tài khoản ngân hàng sau khi admin duyệt (tối đa 3–5 ngày làm việc).
                    </p>
                    <div className="withdraw-field">
                      <label>Số xu muốn rút <span style={{ color: '#e74c3c' }}>*</span></label>
                      <input
                        type="number"
                        min="10000"
                        placeholder="Tối thiểu 10,000 xu"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="withdraw-input"
                      />
                    </div>
                    <div className="withdraw-field">
                      <label>Thông tin ngân hàng <span style={{ color: '#e74c3c' }}>*</span></label>
                      <textarea
                        placeholder="VD: STK 012345678 Vietcombank - Nguyễn Văn A"
                        value={withdrawBankInfo}
                        onChange={(e) => setWithdrawBankInfo(e.target.value)}
                        className="withdraw-input withdraw-textarea"
                        rows={2}
                      />
                    </div>
                    <div className="withdraw-field">
                      <label>Ghi chú (tuỳ chọn)</label>
                      <input
                        type="text"
                        placeholder="Ghi chú thêm..."
                        value={withdrawNote}
                        onChange={(e) => setWithdrawNote(e.target.value)}
                        className="withdraw-input"
                      />
                    </div>
                    {withdrawMsg && (
                      <div className={`withdraw-msg${withdrawMsg.startsWith('Đã') ? ' withdraw-msg--ok' : ' withdraw-msg--err'}`}>
                        {withdrawMsg}
                      </div>
                    )}
                    <button
                      type="button"
                      className="primary-btn"
                      disabled={withdrawLoading}
                      onClick={async () => {
                        const amt = parseInt(withdrawAmount, 10);
                        if (!amt || amt < 10000) { setWithdrawMsg('Số xu rút tối thiểu là 10,000'); return; }
                        if (!withdrawBankInfo.trim()) { setWithdrawMsg('Vui lòng nhập thông tin ngân hàng'); return; }
                        setWithdrawLoading(true); setWithdrawMsg('');
                        try {
                          await requestWithdrawalApi(amt, withdrawBankInfo.trim(), withdrawNote.trim());
                          setWithdrawMsg('Đã gửi yêu cầu rút tiền thành công! Admin sẽ xử lý trong 3–5 ngày làm việc.');
                          setWithdrawAmount(''); setWithdrawBankInfo(''); setWithdrawNote('');
                          setWithdrawHistoryLoading(true);
                          getWithdrawalRequestsApi()
                            .then((data) => setWithdrawHistory(data))
                            .catch(() => {})
                            .finally(() => setWithdrawHistoryLoading(false));
                        } catch (e) {
                          setWithdrawMsg(e.message || 'Có lỗi xảy ra');
                        } finally {
                          setWithdrawLoading(false);
                        }
                      }}
                    >
                      {withdrawLoading ? 'Đang gửi...' : 'Gửi yêu cầu rút tiền'}
                    </button>
                  </div>

                  <div className="withdraw-history">
                    <div className="withdraw-history-header">
                      <h3 className="withdraw-form-title">Lịch sử rút tiền</h3>
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => {
                          setWithdrawHistoryLoading(true);
                          getWithdrawalRequestsApi()
                            .then((data) => setWithdrawHistory(data))
                            .catch(() => setWithdrawHistory({ data: [], total: 0 }))
                            .finally(() => setWithdrawHistoryLoading(false));
                        }}
                      >↻ Làm mới</button>
                    </div>
                    {withdrawHistoryLoading ? (
                      <div className="revenue-loading">Đang tải...</div>
                    ) : withdrawHistory && withdrawHistory.data && withdrawHistory.data.length > 0 ? (
                      <table className="withdraw-table">
                        <thead>
                          <tr>
                            <th>Thời gian</th>
                            <th>Số xu</th>
                            <th>Thông tin NH</th>
                            <th>Trạng thái</th>
                            <th>Ghi chú của admin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {withdrawHistory.data.map((r) => (
                            <tr key={r.id}>
                              <td>{r.created_at}</td>
                              <td className="revenue-cell-value">{Number(r.amount).toLocaleString()} xu</td>
                              <td className="withdraw-bank-cell">{r.bank_info}</td>
                              <td>
                                <span className={`withdraw-status withdraw-status--${(r.status || '').toLowerCase()}`}>
                                  {r.status === 'PENDING' ? <><FontAwesomeIcon icon={faHourglass} /> Chờ duyệt</>
                                    : r.status === 'APPROVED' ? <><FontAwesomeIcon icon={faCircleCheck} /> Đã duyệt</>
                                    : r.status === 'REJECTED' ? <><FontAwesomeIcon icon={faCircleXmark} /> Từ chối</> : r.status}
                                </span>
                              </td>
                              <td>{r.admin_note || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="revenue-empty">Chưa có yêu cầu rút tiền nào.</div>
                    )}
                  </div>
                </div>
              ) : (
              <>
              <div className="revenue-dashboard-subheader">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setAllRevenue(null);
                    setAllRevenueLoading(true);
                    getAllAuthorRevenueApi()
                      .then((data) => setAllRevenue(data))
                      .catch(() => setAllRevenue({ totalRevenue: 0, comics: [] }))
                      .finally(() => setAllRevenueLoading(false));
                  }}
                >
                  ↻ Làm mới
                </button>
              </div>

              {allRevenueLoading ? (
                <div className="revenue-loading">Đang tải dữ liệu doanh thu...</div>
              ) : allRevenue ? (() => {
                const allComics = allRevenue.comics || [];
                const totalUnlocks = allComics.reduce((s, c) =>
                  s + (c.chapters || []).reduce((s2, ch) => s2 + (ch.unlockCount ?? 0), 0), 0);
                const chaptersWithRevenue = allComics.reduce((s, c) =>
                  s + (c.chapters || []).filter((ch) => (ch.chapterRevenue ?? 0) > 0).length, 0);

                const comicsChartData = allComics
                  .filter((c) => (c.comicRevenue ?? 0) > 0)
                  .map((c) => ({ name: c.comicTitle, revenue: c.comicRevenue ?? 0, unlocks: (c.chapters || []).reduce((s, ch) => s + (ch.unlockCount ?? 0), 0) }));

                const monthlyChartData = (monthlyRevenue || []).map((d) => ({ month: d.month, revenue: Number(d.revenue) }));

                return (
                  <>
                    <div className="revenue-summary-grid">
                      <div className="revenue-summary-card revenue-summary-card--total">
                        <div className="revenue-summary-icon"><FontAwesomeIcon icon={faCoins} /></div>
                        <div className="revenue-summary-value">{(allRevenue.totalRevenue ?? 0).toLocaleString()}</div>
                        <div className="revenue-summary-label">Tổng doanh thu (xu)</div>
                      </div>
                      <div className="revenue-summary-card">
                        <div className="revenue-summary-icon"><FontAwesomeIcon icon={faLockOpen} /></div>
                        <div className="revenue-summary-value">{totalUnlocks.toLocaleString()}</div>
                        <div className="revenue-summary-label">Lượt mở khóa</div>
                      </div>
                      <div className="revenue-summary-card">
                        <div className="revenue-summary-icon"><FontAwesomeIcon icon={faBookOpen} /></div>
                        <div className="revenue-summary-value">{allComics.length}</div>
                        <div className="revenue-summary-label">Truyện có doanh thu</div>
                      </div>
                      <div className="revenue-summary-card">
                        <div className="revenue-summary-icon"><FontAwesomeIcon icon={faFile} /></div>
                        <div className="revenue-summary-value">{chaptersWithRevenue}</div>
                        <div className="revenue-summary-label">Chapter đã mở khóa</div>
                      </div>
                    </div>

                    {monthlyChartData.length > 0 && (
                      <div className="revenue-chart-card">
                        <h4 className="revenue-chart-title"><FontAwesomeIcon icon={faChartLine} /> Doanh thu theo tháng</h4>
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={monthlyChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                            <Tooltip formatter={(v) => [`${Number(v).toLocaleString()} xu`, 'Doanh thu']} />
                            <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#58b947" strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {comicsChartData.length > 1 && (
                      <div className="revenue-chart-card">
                        <h4 className="revenue-chart-title"><FontAwesomeIcon icon={faChartBar} /> So sánh doanh thu theo truyện</h4>
                        <ResponsiveContainer width="100%" height={Math.max(180, comicsChartData.length * 44)}>
                          <BarChart data={comicsChartData} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                            <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: 'var(--text)' }} />
                            <Tooltip formatter={(v, name) => [`${Number(v).toLocaleString()} xu`, 'Doanh thu']} />
                            <Bar dataKey="revenue" name="Doanh thu" fill="#58b947" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {allComics.length > 0 ? (
                      allComics.map((comic, comicIdx) => {
                        const comicUnlocks = (comic.chapters || []).reduce((s, ch) => s + (ch.unlockCount ?? 0), 0);
                        const comicRevenue = comic.comicRevenue ?? 0;
                        const topChapters = (comic.chapters || [])
                          .filter((ch) => (ch.chapterRevenue ?? 0) > 0)
                          .slice(0, 8)
                          .map((ch) => ({ name: `Chap ${ch.chapterNo}`, revenue: ch.chapterRevenue ?? 0, unlocks: ch.unlockCount ?? 0 }));
                        return (
                          <div key={comic.comicId} className="revenue-comic-block">
                            <div
                              className="revenue-comic-header revenue-comic-header--clickable"
                              onClick={() => toggleComicExpand(comic.comicId)}
                            >
                              <div className="revenue-comic-header-left">
                                <span className="revenue-comic-rank">#{comicIdx + 1}</span>
                                <span className="revenue-comic-title">{comic.comicTitle}</span>
                              </div>
                              <div className="revenue-comic-header-right">
                                <span className="revenue-comic-stat"><FontAwesomeIcon icon={faLockOpen} /> {comicUnlocks.toLocaleString()} lượt</span>
                                <span className="revenue-comic-total"><FontAwesomeIcon icon={faCoins} /> {comicRevenue.toLocaleString()} xu</span>
                                <FontAwesomeIcon
                                  icon={faChevronDown}
                                  className={`revenue-comic-chevron${expandedComics.has(comic.comicId) ? ' revenue-comic-chevron--open' : ''}`}
                                />
                              </div>
                            </div>

                            {expandedComics.has(comic.comicId) && (
                              <>
                                {topChapters.length > 1 && (
                                  <div className="revenue-comic-chart">
                                    <ResponsiveContainer width="100%" height={Math.max(130, topChapters.length * 32)}>
                                      <BarChart data={topChapters} layout="vertical" margin={{ top: 2, right: 35, left: 5, bottom: 2 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted)' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                                        <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                                        <Tooltip formatter={(v) => [`${Number(v).toLocaleString()} xu`, 'Doanh thu']} />
                                        <Bar dataKey="revenue" fill="#4a90d9" radius={[0, 3, 3, 0]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                )}

                                <table className="revenue-table">
                                  <thead>
                                    <tr>
                                      <th className="revenue-th-rank">#</th>
                                      <th>Chapter</th>
                                      <th>Lượt mở khóa</th>
                                      <th>Doanh thu</th>
                                      <th className="revenue-th-bar">Tỷ lệ</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(comic.chapters || []).map((ch, idx) => {
                                      const pct = comicRevenue > 0 ? Math.round((ch.chapterRevenue ?? 0) / comicRevenue * 100) : 0;
                                      return (
                                        <tr key={ch.chapterId} className={(ch.chapterRevenue ?? 0) > 0 ? 'revenue-row--earned' : ''}>
                                          <td className="revenue-rank-cell">{idx + 1}</td>
                                          <td>Chap {ch.chapterNo}: {ch.chapterTitle}</td>
                                          <td>{(ch.unlockCount ?? 0).toLocaleString()}</td>
                                          <td className="revenue-cell-value">{(ch.chapterRevenue ?? 0).toLocaleString()} xu</td>
                                          <td>
                                            <div className="revenue-bar-wrap">
                                              <div className="revenue-bar" style={{ width: `${pct}%` }} />
                                              <span className="revenue-bar-pct">{pct}%</span>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="revenue-empty">Chưa có truyện nào có doanh thu.</div>
                    )}
                  </>
                );
              })() : null}
              </>
              )}
            </section>
          ) : mainTab === 'analytics' ? (
            <section className="revenue-dashboard">
              <div className="revenue-dashboard-header">
                <h2 className="revenue-dashboard-title">Thống kê truyện của bạn</h2>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setAllComicsStatsLoading(true);
                    setAllComicsStatsError(null);
                    setAllComicsStats(null);
                    getAllMyComicsStatsApi()
                      .then((data) => { setAllComicsStats(Array.isArray(data) ? data : []); })
                      .catch((err) => { setAllComicsStatsError(err.message || 'Lỗi tải thống kê'); setAllComicsStats([]); })
                      .finally(() => setAllComicsStatsLoading(false));
                  }}
                >
                  ↻ Làm mới
                </button>
              </div>
              {allComicsStatsLoading ? (
                <div className="revenue-loading">Đang tải thống kê...</div>
              ) : allComicsStatsError ? (
                <div className="revenue-empty" style={{ color: '#dc2626' }}>Lỗi: {allComicsStatsError}</div>
              ) : allComicsStats && allComicsStats.length === 0 ? (
                <div className="revenue-empty">Bạn chưa có truyện nào được đăng.</div>
              ) : allComicsStats ? (() => {
                const sortKeys = [
                  { key: 'totalViews',    label: <><FontAwesomeIcon icon={faEye} /> Lượt xem</> },
                  { key: 'totalComments', label: <><FontAwesomeIcon icon={faCommentDots} /> Bình luận</> },
                  { key: 'avgRating',     label: <><FontAwesomeIcon icon={faStar} /> Đánh giá</> },
                  { key: 'totalFollows',  label: <><FontAwesomeIcon icon={faUsers} /> Theo dõi</> },
                ];
                const sorted = [...allComicsStats].sort((a, b) => (b[statsSortKey] ?? 0) - (a[statsSortKey] ?? 0));
                return (
                  <>
                    <div className="revenue-subtabs" style={{ marginBottom: 16 }}>
                      {sortKeys.map((sk) => (
                        <button
                          key={sk.key}
                          type="button"
                          className={statsSortKey === sk.key ? 'active' : ''}
                          onClick={() => setStatsSortKey(sk.key)}
                        >
                          {sk.label}
                        </button>
                      ))}
                    </div>
                    <table className="revenue-table">
                      <thead>
                        <tr>
                          <th className="revenue-th-rank">#</th>
                          <th>Truyện</th>
                          <th><FontAwesomeIcon icon={faEye} /> Xem</th>
                          <th><FontAwesomeIcon icon={faCommentDots} /> Bình luận</th>
                          <th><FontAwesomeIcon icon={faStar} /> Đánh giá</th>
                          <th><FontAwesomeIcon icon={faUsers} /> Theo dõi</th>
                          <th><FontAwesomeIcon icon={faBook} /> Chương</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((comic, idx) => (
                          <tr key={comic.comicId}>
                            <td className="revenue-th-rank">#{idx + 1}</td>
                            <td>
                              <a href={`/truyen/${comic.slug}`} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>
                                {comic.title}
                              </a>
                            </td>
                            <td>{(comic.totalViews ?? 0).toLocaleString()}</td>
                            <td>{(comic.totalComments ?? 0).toLocaleString()}</td>
                            <td>
                              {comic.totalRatings > 0
                                ? `${Number(comic.avgRating ?? 0).toFixed(1)} (${comic.totalRatings})`
                                : '—'}
                            </td>
                            <td>{(comic.totalFollows ?? 0).toLocaleString()}</td>
                            <td>{comic.totalChapters ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                );
              })() : null}
            </section>
          ) : workspaceLoading ? (
            <section className="workspace-layout">
              <div className="empty-preview" style={{ width: '100%' }}>Đang tải dữ liệu workspace...</div>
            </section>
          ) : viewMode === 'manage' ? (
            <section className="manage-layout">
              {selectedStory === null ? (
                <>
                  <div className="story-list-header">
                    <h3>Truyện của bạn</h3>
                    <button type="button" className="primary-btn" onClick={handleCreateNewStory}>
                      + Tạo truyện mới
                    </button>
                  </div>

                  {myComicsLoading ? (
                    <div className="empty-preview">Đang tải danh sách truyện...</div>
                  ) : (() => {
                    const textDraftSlug = textStory.slug || 'ban-thao-truyen-chu';
                    const comicDraftSlug = comicStory.slug || 'ban-thao-truyen-hinh';
                    const showTextDraft = Boolean(textStory.title.trim()) && !myComics.some((c) => c.slug === textDraftSlug && c.mode === 'text');
                    const showComicDraft = Boolean(comicStory.title.trim()) && !myComics.some((c) => c.slug === comicDraftSlug && c.mode === 'comic');
                    const hasDraftCards = showTextDraft || showComicDraft;

                    return myComics.length === 0 && !hasDraftCards ? (
                    <div className="manage-empty-state">
                      <div className="manage-empty-icon"><FontAwesomeIcon icon={faPenToSquare} /></div>
                      <h3>Chưa có truyện nào</h3>
                      <p>Bấm <strong>"+ Tạo truyện mới"</strong> để bắt đầu viết truyện đầu tiên.</p>
                    </div>
                  ) : (
                    <div className="story-card-list">
                      {showTextDraft && mode === 'text' ? (
                        <div className="story-card story-card--draft" onClick={() => handleSelectDraftStory('text')}>
                          <div className="story-card-cover">
                            {textStory.coverPreview
                              ? <img src={textStory.coverPreview} alt={textStory.title} />
                              : <div className="story-card-cover-empty">Chưa có bìa</div>}
                          </div>
                          <div className="story-card-info">
                            <span className="story-card-mode">Truyện chữ</span>
                            <strong className="story-card-title">{textStory.title}</strong>
                            <span className="story-card-chapters">Chưa đăng chapter nào</span>
                            <span className="story-card-draft-badge"><FontAwesomeIcon icon={faPenToSquare} /> Nháp mới</span>
                          </div>
                        </div>
                      ) : null}
                      {showComicDraft && mode === 'comic' ? (
                        <div className="story-card story-card--draft" onClick={() => handleSelectDraftStory('comic')}>
                          <div className="story-card-cover">
                            {comicStory.coverPreview
                              ? <img src={comicStory.coverPreview} alt={comicStory.title} />
                              : <div className="story-card-cover-empty">Chưa có bìa</div>}
                          </div>
                          <div className="story-card-info">
                            <span className="story-card-mode">Truyện hình</span>
                            <strong className="story-card-title">{comicStory.title}</strong>
                            <span className="story-card-chapters">Chưa đăng chapter nào</span>
                            <span className="story-card-draft-badge"><FontAwesomeIcon icon={faPenToSquare} /> Nháp mới</span>
                          </div>
                        </div>
                      ) : null}
                      {myComics.filter((comic) => comic.mode === mode || (mode === 'text' && !comic.mode)).map((comic) => {
                        const hasDraft = comic.mode === 'text'
                          ? (textStory.slug === comic.slug && Boolean((textStory.chapterTitle || '').trim() || (textStory.content || '').trim()))
                          : (comicStory.slug === comic.slug && Boolean((comicStory.chapterTitle || '').trim() || comicPages.length > 0));
                        return (
                          <div key={comic.id} className="story-card" onClick={() => handleSelectStory(comic)}>
                            <div className="story-card-cover">
                              {comic.coverUrl
                                ? <img src={comic.coverUrl} alt={comic.title} />
                                : <div className="story-card-cover-empty">Chưa có bìa</div>}
                            </div>
                            <div className="story-card-info">
                              <span className="story-card-mode">{comic.mode === 'text' ? 'Truyện chữ' : 'Truyện hình'}</span>
                              <strong className="story-card-title">{comic.title}</strong>
                              <span className="story-card-chapters">{comic.chapterCount} chapter</span>
                              {(() => {
                                const si = storyStatusInfo(comic.storyStatus);
                                return (
                                  <span className="story-card-status-badge" style={{ color: si.color, background: si.bg, borderColor: si.border }}>
                                    {si.label}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                </>
              ) : (
                <>
                  <div className="story-detail-header">
                    <button type="button" className="ghost-btn" onClick={() => { setSelectedStory(null); setSelectedComicDetail(null); }}>
                      ← Tất cả truyện
                    </button>
                    <div className="story-detail-card">
                      <div className="story-detail-cover">
                        {storyInfoEditing ? (
                          <>
                            {storyInfoForm.coverUrl
                              ? <img src={storyInfoForm.coverUrl} alt={storyInfoForm.title} />
                              : <div className="story-detail-cover-empty">Chưa có bìa</div>}
                            <label className="story-info-cover-btn">
                              {uploading.storyInfoCover ? 'Đang upload...' : 'Đổi bìa'}
                              <input type="file" accept="image/*" disabled={uploading.storyInfoCover} onChange={handleStoryInfoCoverUpload} />
                            </label>
                          </>
                        ) : (
                          selectedStory.coverUrl
                            ? <img src={selectedStory.coverUrl} alt={selectedStory.title} />
                            : <div className="story-detail-cover-empty">Chưa có bìa</div>
                        )}
                      </div>
                      <div className="story-detail-info">
                        <span className="story-detail-mode">{selectedStory.mode === 'text' ? 'Truyện chữ' : 'Truyện hình'}</span>
                        {storyInfoEditing ? (
                          <>
                            <input
                              className="story-info-title-input"
                              value={storyInfoForm.title}
                              onChange={(e) => setStoryInfoForm((prev) => ({ ...prev, title: e.target.value }))}
                              placeholder="Tên truyện"
                            />
                            <textarea
                              className="story-info-desc-input"
                              value={storyInfoForm.description}
                              onChange={(e) => setStoryInfoForm((prev) => ({ ...prev, description: e.target.value }))}
                              placeholder="Mô tả truyện..."
                              rows={3}
                            />
                            <input
                              className="story-info-categories-input"
                              value={storyInfoForm.categories}
                              onChange={(e) => setStoryInfoForm((prev) => ({ ...prev, categories: e.target.value }))}
                              placeholder="Thể loại: Fantasy, Romance, Action... (phân cách bằng dấu phẩy)"
                            />
                            <div className="story-info-edit-actions">
                              <button type="button" className="primary-btn" disabled={storyInfoSaving || uploading.storyInfoCover} onClick={handleSaveStoryInfo}>
                                {storyInfoSaving ? 'Đang lưu...' : 'Lưu'}
                              </button>
                              <button type="button" className="ghost-btn" disabled={storyInfoSaving} onClick={() => setStoryInfoEditing(false)}>
                                Hủy
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <strong className="story-detail-title">{selectedStory.title}</strong>
                            {selectedStory.description ? (
                              <p className="story-detail-desc">{selectedStory.description}</p>
                            ) : null}
                            {selectedStory.categories ? (
                              <div className="story-categories-chips">
                                {selectedStory.categories.split(',').map((cat) => cat.trim()).filter(Boolean).map((cat) => (
                                  <span key={cat} className="story-category-chip">{cat}</span>
                                ))}
                              </div>
                            ) : null}
                            <span className="story-detail-chapters">{selectedComicDetail?.chapters?.length ?? selectedStory.chapterCount} chapter đã đăng</span>
                            {storyStats ? (
                              <div className="story-stats-chips">
                                <span className="story-stats-chip"><FontAwesomeIcon icon={faEye} /> {(storyStats.totalViews ?? 0).toLocaleString()} lượt xem</span>
                                <span className="story-stats-chip"><FontAwesomeIcon icon={faBook} /> {storyStats.totalChapters ?? 0} chapter</span>
                                {storyStats.totalRatings > 0 ? (
                                  <span className="story-stats-chip"><FontAwesomeIcon icon={faStar} /> {Number(storyStats.averageRating ?? 0).toFixed(1)} ({storyStats.totalRatings} đánh giá)</span>
                                ) : null}
                                <span className="story-stats-chip"><FontAwesomeIcon icon={faCommentDots} /> {storyStats.totalComments ?? 0} bình luận</span>
                              </div>
                            ) : null}
                          </>
                        )}
                        <div className="story-detail-actions">
                          {selectedStory.id !== null && selectedStory.slug ? (
                            <Link to={`/truyen/${selectedStory.slug}`} target="_blank" className="secondary-btn story-view-link">
                              Xem truyện ↗
                            </Link>
                          ) : null}
                          {selectedStory.id !== null ? (
                            <select
                              className="story-status-select"
                              value={selectedStory.storyStatus || 'ONGOING'}
                              onChange={(e) => handleUpdateStoryStatus(e.target.value)}
                            >
                              {STORY_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          ) : null}
                          <button type="button" className="primary-btn" onClick={() => handleWriteNewChapterForStory(selectedStory)}>
                            + Viết chapter mới
                          </button>
                          {selectedStory.id !== null && !storyInfoEditing ? (
                            <button type="button" className="secondary-btn" onClick={openStoryInfoEdit}>
                              Sửa thông tin
                            </button>
                          ) : null}
                          <button type="button" className="chapter-remove-btn story-delete-btn" onClick={handleDeleteStory}>
                            Xóa truyện
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedComicDetailLoading ? (
                    <div className="empty-preview">Đang tải chapter...</div>
                  ) : (() => {
                    const committedDraftChapters = selectedStory.mode === 'text'
                      ? (textStory.slug === selectedStory.slug ? textChapters : [])
                      : (comicStory.slug === selectedStory.slug ? comicChapters : []);
                    const workspaceDraftTitle = selectedStory.mode === 'text'
                      ? (textStory.chapterTitle || 'Chapter đang soạn')
                      : (comicStory.chapterTitle || 'Chapter đang soạn');
                    const hasWorkspaceDraft = selectedStory.mode === 'text'
                      ? (textStory.slug === selectedStory.slug) && Boolean((textStory.chapterTitle || '').trim() || (textStory.content || '').trim())
                      : (comicStory.slug === selectedStory.slug) && Boolean((comicStory.chapterTitle || '').trim() || comicPages.length > 0);
                    const showDraft = committedDraftChapters.length > 0 || hasWorkspaceDraft;
                    const publishedChapters = selectedComicDetail?.chapters || [];
                    const CHAPTERS_PER_PAGE = 10;
                    const totalChapterPages = Math.ceil(publishedChapters.length / CHAPTERS_PER_PAGE);
                    const safePage = Math.min(chapterPage, Math.max(0, totalChapterPages - 1));
                    const pagedChapters = publishedChapters.slice(safePage * CHAPTERS_PER_PAGE, (safePage + 1) * CHAPTERS_PER_PAGE);

                    return (
                      <div className="manage-chapter-groups">
                        {publishedChapters.length === 0 && !showDraft ? (
                          <div className="manage-empty-state">
                            <p>Truyện này chưa có chapter. Bấm <strong>"+ Viết chapter mới"</strong> để bắt đầu.</p>
                          </div>
                        ) : (
                          <>
                            {publishedChapters.length > 0 ? (
                              <div className="manage-chapter-group">
                                <h4 className="manage-group-title">Đã đăng</h4>
                                <PublishedChapterList
                                  chapters={pagedChapters}
                                  labelPrefix={selectedStory.mode === 'text' ? 'Chương' : 'Chap'}
                                  selectedChapterId={selectedStory.mode === 'text' ? textTargetChapterId : comicTargetChapterId}
                                  onEdit={openChapterEditor}
                                  onDelete={deletePublishedChapter}
                                  onMoveUp={(id) => handleMoveChapter(id, 'up')}
                                  onMoveDown={(id) => handleMoveChapter(id, 'down')}
                                  reorderingChapterId={reorderingChapterId}
                                  absoluteStartIndex={safePage * CHAPTERS_PER_PAGE}
                                  totalChapters={publishedChapters.length}
                                  deletingChapterId={deletingChapterId}
                                  loading={selectedComicDetailLoading || workspaceSaving || workspacePublishing || reorderingChapterId !== null}
                                />
                                {totalChapterPages > 1 ? (
                                  <div className="chapter-pagination">
                                    <button type="button" className="ghost-btn" disabled={safePage === 0} onClick={() => setChapterPage((p) => Math.max(0, p - 1))}>
                                      ← Trước
                                    </button>
                                    <span className="chapter-pagination-info">Trang {safePage + 1} / {totalChapterPages}</span>
                                    <button type="button" className="ghost-btn" disabled={safePage >= totalChapterPages - 1} onClick={() => setChapterPage((p) => Math.min(totalChapterPages - 1, p + 1))}>
                                      Sau →
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}

                            {showDraft ? (
                              <div className="manage-chapter-group">
                                <h4 className="manage-group-title">Chưa đăng</h4>
                                <div className="chapter-list">
                                  {committedDraftChapters.map((chapter) => (
                                    <div key={chapter.id} className="chapter-item chapter-item--draft">
                                      <div className="chapter-item-row chapter-item-row--title">
                                        <strong>{chapter.title}</strong>
                                        <span className="draft-status-badge">Nháp</span>
                                      </div>
                                      <div className="chapter-item-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                        <button
                                          type="button"
                                          className="primary-btn"
                                          disabled={workspacePublishing}
                                          onClick={() => handlePublishDraftChapterById(chapter.id)}
                                        >
                                          Đăng
                                        </button>
                                        <button
                                          type="button"
                                          className="secondary-btn"
                                          disabled={workspaceSaving || workspaceLoading}
                                          onClick={() => {
                                            // Load draft chapter content/pages into editor for editing
                                            if (selectedStory.mode === 'text') {
                                              setMode('text');
                                              setTextStory((prev) => ({
                                                ...prev,
                                                chapterTitle: chapter.title || prev.chapterTitle,
                                                content: chapter.content || prev.content,
                                                title: selectedStory.title || prev.title,
                                                slug: selectedStory.slug || prev.slug,
                                                coverPreview: selectedStory.coverUrl || prev.coverPreview,
                                              }));
                                            } else {
                                              setMode('comic');
                                              setComicStory((prev) => ({
                                                ...prev,
                                                chapterTitle: chapter.title || prev.chapterTitle,
                                                title: selectedStory.title || prev.title,
                                                slug: selectedStory.slug || prev.slug,
                                                coverPreview: selectedStory.coverUrl || prev.coverPreview,
                                              }));
                                              if (Array.isArray(chapter.pages) && chapter.pages.length > 0) {
                                                setComicPages(chapter.pages.map((p, idx) => normalizeEditorPage(p, idx)));
                                                setComicPagesDirty(false);
                                              }
                                            }
                                            setSelectedStoryHasDraft(true);
                                            setWorkspaceMessage(`Đang mở nháp để chỉnh sửa: ${chapter.title || ''}`);
                                            setViewMode('editor');
                                          }}
                                        >
                                          Sửa
                                        </button>
                                        <button
                                          type="button"
                                          className="chapter-remove-btn"
                                          onClick={() => handleDeleteDraftChapterById(chapter.id)}
                                        >
                                          Xoá nháp
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {hasWorkspaceDraft ? (
                                    <div className="chapter-item chapter-item--draft">
                                      <div className="chapter-item-row chapter-item-row--title">
                                        <strong>{workspaceDraftTitle}</strong>
                                        <span className="draft-status-badge">Đang soạn</span>
                                      </div>
                                      <div className="chapter-item-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                        <button
                                          type="button"
                                          className="primary-btn"
                                          onClick={() => setViewMode('editor')}
                                        >
                                          Tiếp tục soạn
                                        </button>
                                        <button
                                          type="button"
                                          className="chapter-remove-btn"
                                          onClick={() => {
                                            if (!window.confirm('Xoá nháp đang soạn? Dữ liệu sẽ mất.')) return;
                                            if (selectedStory.mode === 'text') {
                                              setTextStory((prev) => ({ ...prev, chapterTitle: '', content: '' }));
                                              saveAuthorDraftApi('text', {
                                                ...textStory,
                                                coverUrl: textStory.coverPreview,
                                                chapterTitle: '',
                                                content: '',
                                                targetChapterId: null,
                                              }).catch(() => {});
                                            } else {
                                              setComicStory((prev) => ({ ...prev, chapterTitle: '' }));
                                              setComicPages([]);
                                              saveAuthorDraftApi('comic', {
                                                ...comicStory,
                                                coverUrl: comicStory.coverPreview,
                                                chapterTitle: '',
                                                targetChapterId: null,
                                                pages: [],
                                              }).catch(() => {});
                                            }
                                            if (committedDraftChapters.length === 0) setSelectedStoryHasDraft(false);
                                          }}
                                        >
                                          Xoá nháp
                                        </button>
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* Comment management section */}
                  <div className="manage-chapter-group manage-comments-section">
                    <div className="manage-comments-header" onClick={() => {
                      if (!storyCommentsOpen) {
                        setStoryCommentsOpen(true);
                        if (storyComments === null) {
                          setStoryCommentsLoading(true);
                          getStoryCommentsApi(selectedStory.slug)
                            .then((data) => setStoryComments(data))
                            .catch(() => setStoryComments([]))
                            .finally(() => setStoryCommentsLoading(false));
                        }
                      } else {
                        setStoryCommentsOpen(false);
                      }
                    }}>
                      <h4 className="manage-group-title" style={{ margin: 0 }}>
                        <FontAwesomeIcon icon={faCommentDots} /> Bình luận {storyComments !== null ? `(${storyComments.length})` : ''}
                      </h4>
                      <span className="manage-comments-toggle">{storyCommentsOpen ? '▲' : '▼'}</span>
                    </div>
                    {storyCommentsOpen && (
                      <div className="manage-comments-list">
                        {storyCommentsLoading ? (
                          <p className="manage-comments-empty">Đang tải...</p>
                        ) : storyComments && storyComments.length > 0 ? (
                          storyComments.map((c) => (
                            <div key={c.id} className="manage-comment-item">
                              <div className="manage-comment-meta">
                                <strong>{c.userName || 'Ẩn danh'}</strong>
                                <span className="manage-comment-chapter">· Chap {c.chapterNo}</span>
                                <span className="manage-comment-date">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                              </div>
                              <p className="manage-comment-body">{c.content}</p>
                              <button
                                type="button"
                                className="chapter-remove-btn manage-comment-del-btn"
                                onClick={async () => {
                                  if (!window.confirm('Xóa bình luận này?')) return;
                                  try {
                                    await deleteCommentAsAuthorApi(c.id);
                                    setStoryComments((prev) => prev.filter((x) => x.id !== c.id));
                                  } catch (err) {
                                    alert(err.message || 'Không thể xóa bình luận');
                                  }
                                }}
                              >
                                Xóa
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="manage-comments-empty">Chưa có bình luận nào.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Revenue section */}
                  <div className="manage-chapter-group manage-comments-section">
                    <div className="manage-comments-header" onClick={() => {
                      if (!storyRevenueOpen) {
                        setStoryRevenueOpen(true);
                        if (storyRevenue === null) {
                          setStoryRevenueLoading(true);
                          getAuthorRevenueApi(selectedStory.slug)
                            .then((data) => setStoryRevenue(data))
                            .catch(() => setStoryRevenue({ totalRevenue: 0, items: [] }))
                            .finally(() => setStoryRevenueLoading(false));
                        }
                      } else {
                        setStoryRevenueOpen(false);
                      }
                    }}>
                      <h4 className="manage-group-title" style={{ margin: 0 }}>
                        <FontAwesomeIcon icon={faCoins} /> Doanh thu {storyRevenue !== null ? `(${(storyRevenue.totalRevenue ?? 0).toLocaleString()} xu)` : ''}
                      </h4>
                      <span className="manage-comments-toggle">{storyRevenueOpen ? '▲' : '▼'}</span>
                    </div>
                    {storyRevenueOpen && (
                      <div className="manage-comments-list">
                        {storyRevenueLoading ? (
                          <p className="manage-comments-empty">Đang tải...</p>
                        ) : storyRevenue && storyRevenue.items && storyRevenue.items.length > 0 ? (
                          <>
                            <p className="manage-comment-body" style={{ fontWeight: 600, padding: '8px 0 4px' }}>
                              Tổng: {(storyRevenue.totalRevenue ?? 0).toLocaleString()} xu
                            </p>
                            {storyRevenue.items.map((item) => (
                              <div key={item.chapterId} className="manage-comment-item">
                                <div className="manage-comment-meta">
                                  <strong>Chap {item.chapterNo}: {item.chapterTitle}</strong>
                                  <span className="manage-comment-date">
                                    {item.price} xu × {item.unlockCount} lượt = {(item.chapterRevenue ?? 0).toLocaleString()} xu
                                  </span>
                                </div>
                              </div>
                            ))}
                          </>
                        ) : storyRevenue ? (
                          <p className="manage-comments-empty">Chưa có doanh thu.</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          ) : (
            <section className="workspace-layout">
            <aside className="workspace-sidebar">
              <Panel title="Đang soạn">
                <div className="editor-sidebar-info">
                  <span className="editor-sidebar-label">{mode === 'text' ? 'Truyện chữ' : 'Truyện hình'}</span>
                  {(mode === 'text' ? textTargetChapterId : comicTargetChapterId)
                    ? <span className="editor-sidebar-editing">Đang sửa chapter đã đăng</span>
                    : <span className="editor-sidebar-new">Chapter mới</span>}
                </div>
                <button
                  type="button"
                  className="ghost-btn"
                  style={{ width: '100%', marginTop: 10 }}
                  onClick={() => setViewMode('manage')}
                >
                  ← Quản lý chapter
                </button>
              </Panel>

              {mode === 'text' && !textPublishedComic?.chapters?.length ? (
                <Panel title="Thông tin truyện" subtitle="Đặt tên và ảnh bìa cho truyện mới">
                  <div className="field">
                    <span>Tên truyện</span>
                    <input value={textStory.title || ''} onChange={handleTextStoryChange('title')} placeholder="Nhập tên truyện..." />
                  </div>
                  <div className="field" style={{ marginTop: 8 }}>
                    <span>Slug (đường dẫn)</span>
                    <input value={textStory.slug || ''} onChange={handleTextStoryChange('slug')} placeholder="vd: truyen-cua-toi" />
                  </div>
                  <div className="field" style={{ marginTop: 8 }}>
                    <span>Mô tả</span>
                    <textarea value={textStory.description || ''} onChange={handleTextStoryChange('description')} placeholder="Mô tả truyện..." rows={3} style={{ width: '100%', resize: 'vertical' }} />
                  </div>
                  <div className="field" style={{ marginTop: 8 }}>
                    <span>Thể loại</span>
                    <input value={textStory.categories || ''} onChange={handleTextStoryChange('categories')} placeholder="Fantasy, Romance, Action... (phân cách bằng dấu phẩy)" />
                  </div>
                  <div className="field" style={{ marginTop: 8 }}>
                    <span>Ảnh bìa</span>
                    <input type="file" accept="image/*" disabled={uploading.textCover} onChange={handleTextStoryChange('coverPreview')} />
                    {uploading.textCover ? <small>Đang upload...</small> : null}
                  </div>
                  {textStory.coverPreview ? (
                    <img src={textStory.coverPreview} alt="Bìa" style={{ marginTop: 8, width: '100%', borderRadius: 6, border: '1px solid #dbe3ed' }} />
                  ) : null}
                </Panel>
              ) : null}

              {mode === 'text' && textPublishedComic?.chapters?.length > 0 ? (
                <Panel title="Sửa chapter cũ" subtitle="Chọn chapter đã đăng để chỉnh sửa">
                  <div className="field">
                    <select value={textTargetChapterId} onChange={(event) => handlePublishedTextChapterSelect(event.target.value)}>
                      <option value="">— Đăng chapter mới —</option>
                      {textPublishedComic.chapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>
                          Chương {chapter.chapterNo} - {chapter.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  {textTargetChapterId ? (
                    <div className="action-row" style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        className="secondary-btn"
                        disabled={textPublishedLoading}
                        onClick={() => loadPublishedTextChapterIntoEditor(textTargetChapterId)}
                      >
                        {textPublishedLoading ? 'Đang tải...' : 'Tải vào editor'}
                      </button>
                    </div>
                  ) : null}
                </Panel>
              ) : null}

              {mode === 'comic' && !publishedComic?.chapters?.length ? (
                <Panel title="Thông tin truyện" subtitle="Đặt tên và ảnh bìa cho truyện mới">
                  <div className="field">
                    <span>Tên truyện</span>
                    <input value={comicStory.title || ''} onChange={handleComicStoryChange('title')} placeholder="Nhập tên truyện..." />
                  </div>
                  <div className="field" style={{ marginTop: 8 }}>
                    <span>Slug (đường dẫn)</span>
                    <input value={comicStory.slug || ''} onChange={handleComicStoryChange('slug')} placeholder="vd: truyen-cua-toi" />
                  </div>
                  <div className="field" style={{ marginTop: 8 }}>
                    <span>Mô tả</span>
                    <textarea value={comicStory.description || ''} onChange={handleComicStoryChange('description')} placeholder="Mô tả truyện..." rows={3} style={{ width: '100%', resize: 'vertical' }} />
                  </div>
                  <div className="field" style={{ marginTop: 8 }}>
                    <span>Thể loại</span>
                    <input value={comicStory.categories || ''} onChange={handleComicStoryChange('categories')} placeholder="Fantasy, Romance, Action... (phân cách bằng dấu phẩy)" />
                  </div>
                  <div className="field" style={{ marginTop: 8 }}>
                    <span>Ảnh bìa</span>
                    <input type="file" accept="image/*" disabled={uploading.comicCover} onChange={handleComicStoryChange('coverPreview')} />
                    {uploading.comicCover ? <small>Đang upload...</small> : null}
                  </div>
                  {comicStory.coverPreview ? (
                    <img src={comicStory.coverPreview} alt="Bìa" style={{ marginTop: 8, width: '100%', borderRadius: 6, border: '1px solid #dbe3ed' }} />
                  ) : null}
                </Panel>
              ) : null}

              {mode === 'comic' && publishedComic?.chapters?.length > 0 ? (
                <Panel title="Sửa chapter cũ" subtitle="Chọn chapter đã đăng để chỉnh sửa">
                  <div className="field">
                    <select value={comicTargetChapterId} onChange={(event) => handlePublishedChapterSelect(event.target.value)}>
                      <option value="">— Đăng chapter mới —</option>
                      {publishedComic.chapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>
                          Chap {chapter.chapterNo} - {chapter.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  {comicTargetChapterId ? (
                    <div className="action-row" style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        className="secondary-btn"
                        disabled={publishedComicLoading}
                        onClick={() => loadPublishedChapterIntoEditor(comicTargetChapterId)}
                      >
                        {publishedComicLoading ? 'Đang tải...' : 'Tải vào editor'}
                      </button>
                    </div>
                  ) : null}
                </Panel>
              ) : null}
            </aside>

            <section className="workspace-main">
              {mode === 'text' ? (
                <>
                  <Panel
                    title="Editor truyện chữ"
                    subtitle="Tùy chỉnh nội dung và định dạng trước khi xuất bản"
                  >
                    <div className="field-grid">
                      <label className="field field--full">
                        <span>Tên chapter</span>
                        <input value={textStory.chapterTitle || ''} onChange={handleTextStoryChange('chapterTitle')} placeholder="vd: Chương 1: Khởi đầu" />
                      </label>
                      <label className="field">
                        <span>Giá mở khóa (xu) — 0 = miễn phí</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={textStory.chapterPrice ?? 0}
                          onChange={(e) => setTextStory((prev) => ({ ...prev, chapterPrice: Math.max(0, Number(e.target.value) || 0) }))}
                          placeholder="0"
                        />
                      </label>
                    </div>

                    <div className="toolbar-grid">
                      <label className="field">
                        <span>Font chữ</span>
                        <FontPicker
                          value={textStory.fontFamily || 'Lora'}
                          onChange={(font) => setTextStory((prev) => ({ ...prev, fontFamily: font }))}
                        />
                      </label>
                      <label className="field">
                        <span>Cỡ chữ</span>
                        <input type="range" min="14" max="28" value={textStory.fontSize || 18} onChange={handleTextStoryChange('fontSize')} />
                      </label>
                      <label className="field">
                        <span>Màu chữ</span>
                        <input type="color" value={textStory.color || '#2b2f36'} onChange={handleTextStoryChange('color')} />
                      </label>
                      <label className="field">
                        <span>Nền preview</span>
                        <input type="color" value={textStory.background || '#fffaf3'} onChange={handleTextStoryChange('background')} />
                      </label>
                      <label className="field">
                        <span>Khoảng cách chữ</span>
                        <input type="range" min="0" max="3" step="0.1" value={textStory.letterSpacing || 0} onChange={handleTextStoryChange('letterSpacing')} />
                      </label>
                    </div>

                    <div className="editor-grid">
                      <label className="field field--full">
                        <span>Nội dung chương</span>
                        <textarea rows={12} value={textStory.content || ''} onChange={handleTextStoryChange('content')} />
                        <div className="action-row" style={{ marginTop: 8 }}>
                          <button type="button" className="secondary-btn" onClick={applyAutoParagraphForText}>Tự tách đoạn</button>
                        </div>
                      </label>

                      <div className="preview-frame" style={previewStyle}>
                        <div className="preview-head">
                          <strong>{textStory.title}</strong>
                          <span>Preview trực quan</span>
                        </div>
                        <div className="preview-content">
                          {textPreviewParagraphs.length === 0 ? (
                            <p>{textStory.content}</p>
                          ) : textPreviewParagraphs.map((paragraph, index) => (
                            <p key={`preview-paragraph-${index}`}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                  </Panel>

                </>
              ) : (
                <>
                  <Panel
                    title="Editor truyện hình"
                    subtitle="Tải ảnh chapter và sắp xếp trước khi đăng"
                  >
                    <div className="field-grid">
                      <label className="field field--full">
                        <span>Tên chapter</span>
                        <input value={comicStory.chapterTitle || ''} onChange={handleComicStoryChange('chapterTitle')} placeholder="vd: Chap 1" />
                      </label>
                      <label className="field">
                        <span>Giá mở khóa (xu) — 0 = miễn phí</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={comicStory.chapterPrice ?? 0}
                          onChange={(e) => setComicStory((prev) => ({ ...prev, chapterPrice: Math.max(0, Number(e.target.value) || 0) }))}
                          placeholder="0"
                        />
                      </label>
                    </div>

                    <div className="comic-upload-zone">
                      <label className="field field--full">
                        <span>Upload ảnh trang truyện</span>
                        <input type="file" accept="image/*" multiple disabled={uploading.comicPages} onChange={handleComicPagesUpload} />
                      </label>
                      <div className="drop-hint">Kéo thả hoặc chọn nhiều ảnh để tạo chapter truyện hình.</div>
                      {uploading.comicPages ? <div className="drop-hint">Dang upload anh trang len ImageKit...</div> : null}
                    </div>

                    <div className="file-grid">
                      {comicPages.length === 0 ? (
                        <div className="empty-preview empty-preview--grid">Chưa có trang nào được chọn</div>
                      ) : comicPages.map((page, index) => (
                        <figure
                          key={page.id}
                          className={`page-card${comicTargetChapterId ? ' page-card--editing' : ''}${dragOverIndex === index ? ' page-card--dragover' : ''}`}
                          draggable
                          onDragStart={() => handlePageDragStart(index)}
                          onDragOver={(e) => handlePageDragOver(e, index)}
                          onDrop={() => handlePageDrop(index)}
                          onDragEnd={handlePageDragEnd}
                        >
                          <div className="page-card-drag-handle">⠿</div>
                          <img src={page.url} alt={page.name} />
                          <figcaption>{index + 1}. {page.name}</figcaption>
                          <div className="page-card-actions">
                            <button type="button" className="page-card-btn page-card-btn--remove" onClick={() => removeComicPage(index)}>Xóa</button>
                            <label className="page-card-btn page-card-btn--replace">
                              Thay ảnh
                              <input type="file" accept="image/*" onChange={(event) => replaceComicPage(index, event)} />
                            </label>
                          </div>
                        </figure>
                      ))}
                    </div>

                    <div className="action-row" style={{ marginTop: 10 }}>
                      <button
                        type="button"
                        className="secondary-btn"
                        disabled={!comicPagesDirty || workspaceSaving || workspacePublishing || workspaceLoading || uploading.comicPages}
                        onClick={saveComicPageChanges}
                      >
                        {workspaceSaving ? 'Dang luu...' : 'Lưu thay đổi ảnh'}
                      </button>
                    </div>

                    {comicTargetChapterId ? (
                      <div className="tip-box">
                        Đang chỉnh sửa chapter public đã chọn. Khi bấm <strong>Đăng</strong>, hệ thống sẽ ghi đè toàn bộ ảnh của chapter này.
                      </div>
                    ) : null}
                  </Panel>

                </>
              )}
            </section>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

const STORY_STATUSES = [
  { value: 'ONGOING',   label: 'Đang sáng tác',   color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
  { value: 'COMPLETED', label: 'Hoàn thành',     color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe' },
  { value: 'HIATUS',    label: 'Tạm dừng',       color: '#d97706', bg: '#fff7ed', border: '#fed7aa' },
  { value: 'DROPPED',   label: 'Ngừng sáng tác', color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
  { value: 'UPCOMING',  label: 'Sắp ra mắt',     color: '#db2777', bg: '#fce7f3', border: '#fbcfe8' },
];

function storyStatusInfo(status) {
  return STORY_STATUSES.find((s) => s.value === status) || STORY_STATUSES[0];
}