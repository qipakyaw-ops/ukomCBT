import React, { useEffect, useState } from 'react';
import { Bookmark, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import CbtPageShell from '@/components/cbt/CbtPageShell';
import { loadBookmarks, getBookmarkIds, removeBookmark } from '@/lib/bookmarkStore';
import questionClient from '@/api/questionClient';

export default function Bookmarks() {
  const { user } = useAuth();
  const [bookmarkIds, setBookmarkIds] = useState(() => getBookmarkIds(user?.id));
  const [questionsById, setQuestionsById] = useState(() => new Map());

  useEffect(() => {
    if (!user?.id) {
      setBookmarkIds([]);
      return undefined;
    }
    let cancelled = false;
    const load = async () => {
      const ids = await loadBookmarks(user.id);
      if (!cancelled) setBookmarkIds(ids);
    };
    load();
    const updateBookmarks = () => setBookmarkIds(getBookmarkIds(user.id));
    window.addEventListener('cbtBookmarksUpdated', updateBookmarks);
    return () => {
      cancelled = true;
      window.removeEventListener('cbtBookmarksUpdated', updateBookmarks);
    };
  }, [user?.id]);

  useEffect(() => {
    questionClient.getQuestions({ limit: 1000 })
      .then((res) => setQuestionsById(new Map(res.questions.map((q) => [q.id, q]))))
      .catch(() => {});
  }, []);

  const items = bookmarkIds.map((id) => questionsById.get(id)).filter(Boolean);

  const removeBookmarkItem = async (questionId) => {
    if (!user?.id) return;
    const nextIds = await removeBookmark(user.id, questionId);
    setBookmarkIds(nextIds);
  };

  if (items.length === 0) {
    return (
      <CbtPageShell title="Bookmark Soal" description="Kumpulan soal yang kamu simpan untuk dipelajari kembali.">
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Bookmark className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <h2 className="mt-4 font-heading text-lg font-bold">Belum ada bookmark</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Soal yang ditandai saat sesi CBT akan muncul di halaman ini.
          </p>
        </div>
      </CbtPageShell>
    );
  }

  return (
    <CbtPageShell title="Bookmark Soal" description="Kumpulan soal yang kamu simpan untuk dipelajari kembali.">
      <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
        {items.map((q) => {
          const parseOptionsSafe = (options) => {
            if (!options) return {};
            let parsed = options;
            while (typeof parsed === 'string') {
              try {
                parsed = JSON.parse(parsed);
              } catch (e) {
                break;
              }
            }
            return parsed && typeof parsed === 'object' ? parsed : {};
          };

          const optionsObj = parseOptionsSafe(q.options);
          const correctText = q.pilihan?.[q.correctAnswer] || optionsObj[q.correctAnswer]?.text || '';
          return (
          <div key={q.id} className="group flex items-start gap-3 rounded-xl border border-border p-3 transition-all hover:border-primary/40 hover:bg-accent">
            <Bookmark className="mt-0.5 h-4 w-4 shrink-0 fill-amber-400 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-primary">{q.kategori}</p>
              {q.vignette?.trim() && (
                <p className="mt-0.5 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs italic leading-relaxed text-muted-foreground">{q.vignette}</p>
              )}
              <p className="mt-1 text-sm font-medium leading-snug">{q.pertanyaan}</p>
              <p className="mt-1.5 text-xs"><span className="font-semibold text-emerald-700">Jawaban benar: </span><span className="text-emerald-700">{q.correctAnswer}. {correctText}</span></p>
              {q.pembahasan && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{q.pembahasan}</p>}
              <div className="mt-1.5 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${q.tingkatKesulitan === 'Mudah' ? 'bg-emerald-500/10 text-emerald-600' : q.tingkatKesulitan === 'Sedang' ? 'bg-amber-500/10 text-amber-600' : 'bg-destructive/10 text-destructive'}`}>
                  {q.tingkatKesulitan}
                </span>
              </div>
            </div>
            <button onClick={() => removeBookmarkItem(q.id)} className="rounded-md p-2 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          );
        })}
      </div>
    </CbtPageShell>
  );
}
