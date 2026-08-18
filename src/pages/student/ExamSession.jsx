import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bookmark, ChevronLeft, ChevronRight, Clock3, Flag, PlayCircle, Send } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import CbtPageShell from '@/components/cbt/CbtPageShell';
import questionClient from '@/api/questionClient.js';
import { getCbtSession, submitCbtSession, updateCbtSession } from '@/lib/cbtSessionStore';
import { loadBookmarks, getBookmarkIds, toggleBookmark } from '@/lib/bookmarkStore';

function getRemainingSeconds(session) {
  if (!session?.startTime) return 0;
  const durationSeconds = Number(session.config?.durasi ?? 0) * 60;
  const elapsedSeconds = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
  return Math.max(0, durationSeconds - elapsedSeconds);
}

function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
    : [minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export default function ExamSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [localAnswers, setLocalAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!sessionId || !user?.id) return;
    
    const nextSession = getCbtSession(sessionId, user.id);
    
    setSession(nextSession);
    if (nextSession) {
      setLocalAnswers(nextSession.answers ?? {});
      setCurrentIndex(nextSession.currentQuestionIndex ?? 0);
    }
    setIsLoadingSession(false);
  }, [sessionId, user?.id]);
  
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const ignoreNavigationGuardRef = useRef(false);
  const isUpdatingRef = useRef(false); // ponytail: flag untuk mencegah re-render saat update lokal

  // ponytail: effect ini dihapus karena duplikat dan menyebabkan state session valid menjadi null
  // useEffect(() => {
  //   const nextSession = getCbtSession(sessionId);
  //   setSession(nextSession);
  //   setRemainingSeconds(getRemainingSeconds(nextSession));
  //   setCurrentIndex(nextSession?.currentQuestionIndex ?? 0);
  // }, [sessionId]);

  useEffect(() => {
    if (!session || session.status !== 'in_progress') return undefined;

    // Intercept internal link clicks to warn before leaving
    const onDocumentClick = (e) => {
      // Only consider primary button clicks without modifier
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // Find closest anchor
      const a = e.target.closest && e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href) return;
      // Do not intercept external links, download links, or target blank
      if (a.target === '_blank' || a.download || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (href.startsWith('http://') || href.startsWith('https://')) {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
      }
      // Only intercept internal app links (starting with /)
      if (!href.startsWith('/')) return;
      // If link points to the same session page, allow
      if (href.includes(`/student/latihan/${session.id}`)) return;

      // Prevent navigation and show confirmation
      e.preventDefault();
      e.stopPropagation();
      setPendingNavigation(href);
      setShowLeaveDialog(true);
    };

    // Intercept back/forward (popstate)
    const onPopState = () => {
      setPendingNavigation(null);
      setShowLeaveDialog(true);
    };

    // Warn on browser refresh/tab close if CBT still in progress
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    // Intercept history.pushState / replaceState to catch programmatic navigations
    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;

    const shouldInterceptHref = (href) => {
      if (!href) return false;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return false;
        const path = url.pathname + url.search + url.hash;
        if (path.includes(`/student/latihan/${session.id}`)) return false;
        if (!path.startsWith('/')) return false;
        return true;
      } catch {
        return false;
      }
    };

    window.history.pushState = function (state, title, url) {
      if (!ignoreNavigationGuardRef.current && shouldInterceptHref(url)) {
        setPendingNavigation(url);
        setShowLeaveDialog(true);
        return;
      }
      return origPush.apply(this, arguments);
    };

    window.history.replaceState = function (state, title, url) {
      if (!ignoreNavigationGuardRef.current && shouldInterceptHref(url)) {
        setPendingNavigation(url);
        setShowLeaveDialog(true);
        return;
      }
      return origReplace.apply(this, arguments);
    };

    document.addEventListener('click', onDocumentClick, true);
    window.addEventListener('popstate', onPopState);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      document.removeEventListener('click', onDocumentClick, true);
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('beforeunload', onBeforeUnload);
      // restore
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
    };
  }, [session]);

  useEffect(() => {
    if (!session || session.status !== 'in_progress') return undefined;

    const updateRemainingTime = () => {
      const nextRemainingSeconds = getRemainingSeconds(session);
      setRemainingSeconds(nextRemainingSeconds);

      if (nextRemainingSeconds === 0) {
        const expiredSession = updateCbtSession(session.id, {
          status: 'expired',
          autoSubmitted: true,
          submittedAt: new Date().toISOString(),
        });
        if (expiredSession) setSession(expiredSession);
      }
    };

    updateRemainingTime();
    const intervalId = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(intervalId);
  }, [session]);

  useEffect(() => {
    // Listen for session updates triggered elsewhere (e.g., Bookmarks page)
    const handleExternalUpdate = (e) => {
      const updated = e.detail;
      if (!updated || isUpdatingRef.current) return; // ponytail: abaikan jika sedang update lokal
      if (updated.id === session?.id) {
        // ponytail: hanya re-render jika metadata selain jawaban berubah
        const { answers: _a, ...updatedMeta } = updated;
        const { answers: _b, ...currentMeta } = session || {};
        if (JSON.stringify(updatedMeta) !== JSON.stringify(currentMeta)) {
          setSession(updated);
          setCurrentIndex(updated.currentQuestionIndex ?? 0);
        }
      }
    };
    window.addEventListener('cbtSessionUpdated', handleExternalUpdate);
    return () => window.removeEventListener('cbtSessionUpdated', handleExternalUpdate);
  }, [session]);

  const [bookmarkIds, setBookmarkIds] = useState(() => getBookmarkIds(user?.id));

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    loadBookmarks(user.id).then((ids) => {
      if (!cancelled) setBookmarkIds(ids);
    });
    return () => { cancelled = true; };
  }, [user?.id]);
  const [questions, setQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false); // ponytail: mulai dari false

  useEffect(() => {
    // ponytail: Hanya fetch jika session valid dan perlu fetch
    if (!session?.id || !session.questionIds || session.questionIds.length === 0) {
      setIsLoadingQuestions(false);
      return;
    }
    
    let cancelled = false;
    const fetchQuestions = async () => {
      setIsLoadingQuestions(true);
      try {
        const results = await Promise.all(
          session.questionIds.map(id => questionClient.getQuestionById(id))
        );

        if (!cancelled) {
          setQuestions(results);
        }
      } catch (err) {
        console.error("QUESTION_FETCH_ERROR", err);
        if (!cancelled) setQuestions([]);
      } finally {
        if (!cancelled) {
          setIsLoadingQuestions(false);
        }
      }
    };
    fetchQuestions();
    return () => { cancelled = true; };
  }, [session?.id, session?.questionIds?.join(',')]);

  
  const questionsLength = questions.length;

  if (isLoadingSession) {
    return (
      <CbtPageShell title="Sesi CBT" description="Memuat sesi...">
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          Memuat sesi...
        </div>
      </CbtPageShell>
    );
  }

  if (!session) {
    return (
      <CbtPageShell title="Sesi CBT" description="Sesi tidak ditemukan">
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          Sesi CBT tidak ditemukan.
        </div>
      </CbtPageShell>
    );
  }

  if (isLoadingQuestions) {
    return (
      <CbtPageShell title="Sesi CBT" description="Memuat soal...">
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          Memuat soal...
        </div>
      </CbtPageShell>
    );
  }

  if (questions.length === 0) {
    return (
      <CbtPageShell title="Sesi CBT" description="Soal tidak tersedia">
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <PlayCircle className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <h2 className="mt-4 font-heading text-lg font-bold">Soal tidak tersedia</h2>
          <button type="button" onClick={() => navigate('/student/latihan')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:shadow-md">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Latihan
          </button>
        </div>
      </CbtPageShell>
    );
  }
  
  const activeIndex = Math.min(Math.max(currentIndex, 0), questions.length - 1);
  const currentQuestion = questions[activeIndex];

  const answers = localAnswers; // ponytail: gunakan state lokal
  const displayVignette = currentQuestion?.vignette?.trim() || '';
  // ponytail: mapping field sesuai struktur runtime
  const displayQuestionText = currentQuestion?.question?.trim() || '';
  const displayOptions = currentQuestion?.pilihan
    ? Object.entries(currentQuestion.pilihan).map(([id, text]) => ({ id, text }))
    : [];

  const displayImage = currentQuestion?.image?.trim() || '';
  const displayImageCaption = currentQuestion?.imageCaption?.trim() || '';
  const shouldShowVignette = currentQuestion?.type === 'vignette' || Boolean(displayVignette);
  const flaggedQuestionIds = session.flaggedQuestionIds ?? [];
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / questions.length) * 100);
  const selectedAnswer = answers[currentQuestion.id];
  const isBookmarked = bookmarkIds.includes(currentQuestion.id);
  const isFlagged = flaggedQuestionIds.includes(currentQuestion.id);
  const isExpired = session.status === 'expired';
  const isCriticalTime = remainingSeconds <= 60;
  const isWarningTime = remainingSeconds <= 300;
  const flaggedCount = flaggedQuestionIds.length;
  const bookmarkedCount = bookmarkIds.length;

  const handleSubmit = async () => {
    if (isExpired || isSubmitting) return;

    ignoreNavigationGuardRef.current = true;
    setIsSubmitting(true);
    setShowSubmitDialog(false);
    const submittedSession = await submitCbtSession(sessionId, user?.id);
    if (submittedSession) {
      setSession(submittedSession);
      navigate(`/student/hasil/${sessionId}`);
      return;
    }

    ignoreNavigationGuardRef.current = false;
    setIsSubmitting(false);
  };

  const handleLeaveConfirm = (leave) => {
    setShowLeaveDialog(false);
    if (!leave) {
      // Stay in CBT: do nothing
      setPendingNavigation(null);
      return;
    }

    ignoreNavigationGuardRef.current = true;
    if (pendingNavigation) {
      const target = pendingNavigation;
      setPendingNavigation(null);
      try {
        const url = new URL(target, window.location.origin);
        navigate(url.pathname + url.search + url.hash);
      } catch {
        navigate(target);
      }
      return;
    }

    // If popstate triggered leave, go back in history once to allow navigation
    setPendingNavigation(null);
    navigate(-1);
  };

  const saveSession = async (updates) => {
    // ponytail: sertakan user.id agar sinkron dengan updateCbtSession
    const updatedSession = await updateCbtSession(sessionId, user?.id, updates);
    if (updatedSession) setSession(updatedSession);
  };

  const handleNavigate = (nextIndex) => {
    const safeIndex = Math.min(Math.max(nextIndex, 0), questions.length - 1);
    setCurrentIndex(safeIndex);
    saveSession({ currentQuestionIndex: safeIndex });
  };

  const handleAnswer = (answer) => {
    if (isExpired) return;
    setLocalAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
    saveSession({ answers: { ...localAnswers, [currentQuestion.id]: answer } });
  };

  const toggleBookmarkQuestion = async (questionId) => {
    if (isExpired || !user?.id) return;
    const nextIds = await toggleBookmark(user.id, questionId);
    setBookmarkIds(nextIds);
  };

  const toggleFlagQuestion = (questionId) => {
    if (isExpired || !user?.id) return;
    const ids = flaggedQuestionIds;
    const nextIds = ids.includes(questionId)
      ? ids.filter((id) => id !== questionId)
      : [...ids, questionId];
    saveSession({ flaggedQuestionIds: nextIds });
  };

  const getNumberClass = (question) => {
    const answered = Boolean(answers[question.id]);
    const bookmarked = bookmarkIds.includes(question.id);
    const flagged = flaggedQuestionIds.includes(question.id);
    const stateClass = answered ? 'bg-emerald-500/15 text-emerald-700' : 'bg-muted text-muted-foreground';
    const markerClass = flagged ? 'border-destructive ring-1 ring-destructive/20' : bookmarked ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-transparent';
    const activeClass = questions[activeIndex]?.id === question.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : '';
    return `${stateClass} ${markerClass} ${activeClass}`;
  };

  return (
    <CbtPageShell title="Sesi CBT" description={`${session.config.jumlahSoal} soal pilihan sesuai konfigurasi latihan.`}>
      <div className="mb-5 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Latihan CBT</p>
            <p className="mt-1 text-sm text-muted-foreground">Jawaban, bookmark, flag, dan posisi soal tersimpan otomatis.</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-semibold">{answeredCount} dari {questions.length} terjawab</p>
            <p className="mt-1 text-xs text-muted-foreground">Progress {progress}%</p>
          </div>
        </div>
        <div className={`mt-4 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 ${isExpired || isCriticalTime ? 'border-destructive/30 bg-destructive/10 text-destructive' : isWarningTime ? 'border-amber-500/30 bg-amber-500/10 text-amber-700' : 'border-border bg-muted/30 text-foreground'}`}>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Clock3 className="h-4 w-4" />
            <span>{isExpired ? 'Waktu habis' : 'Sisa waktu'}</span>
          </div>
          <span className="font-mono text-lg font-bold tracking-wide">{formatTime(remainingSeconds)}</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        {isExpired && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">
            Waktu sesi telah habis. Session otomatis disubmit dan jawaban tidak dapat diubah lagi.
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="text-sm font-semibold text-primary">Soal {activeIndex + 1}</p>
              <p className="mt-1 text-xs text-muted-foreground">{currentQuestion.kategori} / {currentQuestion.subkategori}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" disabled={isExpired} onClick={() => toggleBookmarkQuestion(currentQuestion.id)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${isBookmarked ? 'border-amber-500 bg-amber-500/10 text-amber-600' : 'border-border text-muted-foreground hover:bg-muted'} disabled:cursor-not-allowed disabled:opacity-50`} aria-pressed={isBookmarked}>
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                {isBookmarked ? 'Tersimpan' : 'Bookmark'}
              </button>
              <button type="button" disabled={isExpired} onClick={() => toggleFlagQuestion(currentQuestion.id)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${isFlagged ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border text-muted-foreground hover:bg-muted'} disabled:cursor-not-allowed disabled:opacity-50`} aria-pressed={isFlagged}>
                <Flag className={`h-4 w-4 ${isFlagged ? 'fill-current' : ''}`} />
                {isFlagged ? 'Ditandai' : 'Tandai'}
              </button>
            </div>
          </div>

          {shouldShowVignette ? (
            <div className="mt-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Kasus</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{displayVignette}</p>
            </div>
          ) : null}

          {displayImage ? (
            <div className="mt-4">
              <img src={displayImage} alt={displayImageCaption || 'Ilustrasi soal'} className="max-h-72 w-full rounded-xl border border-border object-contain" />
              {displayImageCaption ? <p className="mt-2 text-xs text-muted-foreground">{displayImageCaption}</p> : null}
            </div>
          ) : null}

          <h2 className="mt-6 text-lg font-semibold leading-relaxed">{displayQuestionText}</h2>

          <div className="mt-6 space-y-3">
            {displayOptions.map((option) => {
              const selected = selectedAnswer === option.id;
              return (
                <button key={option.id} type="button" disabled={isExpired} onClick={() => handleAnswer(option.id)} className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-all ${selected ? 'border-primary bg-accent ring-2 ring-primary/20' : 'border-border hover:border-primary/40 hover:bg-muted/40'} disabled:cursor-not-allowed disabled:opacity-70`} aria-pressed={selected}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{option.id}</span>
                  <span className="pt-1 leading-relaxed">{option.text}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
            <button type="button" onClick={() => handleNavigate(activeIndex - 1)} disabled={activeIndex === 0} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" /> Sebelumnya
            </button>
            <button type="button" onClick={() => handleNavigate(activeIndex + 1)} disabled={activeIndex === questions.length - 1} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40">
              Berikutnya <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button type="button" onClick={() => setShowSubmitDialog(true)} disabled={isExpired || isSubmitting} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50">
            <Send className="h-4 w-4" /> Submit CBT
          </button>
        </section>

        <aside className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-bold">Nomor Soal</h2>
            <span className="text-xs text-muted-foreground">{activeIndex + 1}/{questions.length}</span>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {questions.map((question, index) => (
              <button key={question.id} type="button" onClick={() => handleNavigate(index)} className={`relative flex aspect-square items-center justify-center rounded-lg border text-sm font-semibold transition-all hover:opacity-80 ${getNumberClass(question)}`} aria-label={`Buka soal ${index + 1}`}>
                {index + 1}
                {(bookmarkIds.includes(question.id) || flaggedQuestionIds.includes(question.id)) && (
                  <span className="absolute -bottom-1 flex gap-0.5">
                    {bookmarkIds.includes(question.id) && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                    {flaggedQuestionIds.includes(question.id) && <span className="h-1.5 w-1.5 rounded-full bg-destructive" />}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-muted" /> Belum dijawab</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-emerald-500/20" /> Sudah dijawab</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-amber-500" /> Bookmark</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-destructive" /> Flag review</div>
          </div>
        </aside>
      </div>

      {showSubmitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => !isSubmitting && setShowSubmitDialog(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="submit-dialog-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="submit-dialog-title" className="font-heading text-lg font-bold">Submit CBT sekarang?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Pastikan jawabanmu sudah sesuai sebelum mengakhiri sesi.</p>
              </div>
              <Send className="mt-1 h-5 w-5 shrink-0 text-primary" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Jumlah soal</p><p className="mt-1 font-bold">{questions.length}</p></div>
              <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Sudah dijawab</p><p className="mt-1 font-bold text-emerald-600">{answeredCount}</p></div>
              <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Belum dijawab</p><p className="mt-1 font-bold text-amber-600">{questions.length - answeredCount}</p></div>
              <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Bookmark</p><p className="mt-1 font-bold text-amber-600">{bookmarkedCount}</p></div>
              <div className="col-span-2 rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Flagged</p><p className="mt-1 font-bold text-destructive">{flaggedCount}</p></div>
            </div>

            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setShowSubmitDialog(false)} disabled={isSubmitting} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">Kembali</button>
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Mengirim...' : 'Ya, Submit CBT'}</button>
            </div>
          </div>
        </div>
      )}
      {showLeaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setShowLeaveDialog(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="leave-dialog-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="leave-dialog-title" className="font-heading text-lg font-bold">CBT masih sedang berlangsung</h2>
                <p className="mt-1 text-sm text-muted-foreground">Jika keluar dari halaman ini, timer tetap berjalan. Anda dapat melanjutkan CBT kapan saja.</p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => handleLeaveConfirm(false)} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted">Tetap di CBT</button>
              <button type="button" onClick={() => handleLeaveConfirm(true)} className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md">Keluar</button>
            </div>
          </div>
        </div>
      )}
    </CbtPageShell>
  );
}
