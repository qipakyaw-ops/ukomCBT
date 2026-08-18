import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { loadBookmarks, getBookmarkIds } from '@/lib/bookmarkStore';
import questionClient from '@/api/questionClient';

const levelTone = {
  Mudah: 'bg-emerald-500/10 text-emerald-600',
  Sedang: 'bg-amber-500/10 text-amber-600',
  Sulit: 'bg-destructive/10 text-destructive',
};

export default function BookmarkedQuestions() {
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

  const items = bookmarkIds.map((id) => questionsById.get(id)).filter(Boolean).slice(0, 4);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Bookmark className="h-4 w-4" />
            </div>
            <h3 className="font-heading text-base font-bold">Bookmark Soal</h3>
          </div>
          <Link to="/student/bookmark" className="text-sm font-medium text-primary hover:underline">
            Semua
          </Link>
        </div>
        <div className="rounded-2xl border border-dashed border-border bg-muted p-6 text-center text-sm text-muted-foreground">
          Belum ada soal yang disimpan. Gunakan tombol bookmark saat mengerjakan sesi CBT.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <Bookmark className="h-4 w-4" />
          </div>
          <h3 className="font-heading text-base font-bold">Bookmark Soal</h3>
        </div>
        <Link to="/student/bookmark" className="text-sm font-medium text-primary hover:underline">
          Semua
        </Link>
      </div>
      <div className="space-y-2.5">
        {items.map((q) => {
          const correctText = q.pilihan?.[q.correctAnswer] || q.options?.find((o) => o.id === q.correctAnswer)?.text || '';
          return (
          <div key={q.id} className="group flex items-start gap-3 rounded-xl border border-border p-3 transition-all hover:border-primary/40 hover:bg-accent">
            <Bookmark className="mt-0.5 h-4 w-4 shrink-0 fill-amber-400 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-primary">{q.kategori}</p>
              {q.vignette?.trim() && (
                <p className="mt-0.5 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs italic leading-relaxed text-muted-foreground">{q.vignette}</p>
              )}
              <p className="mt-1 text-sm font-medium leading-snug">{q.pertanyaan}</p>
              <p className="mt-1 text-xs"><span className="font-semibold text-emerald-700">Jawaban benar: </span><span className="text-emerald-700">{q.correctAnswer}. {correctText}</span></p>
              {q.pembahasan && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{q.pembahasan}</p>}
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
          );
        })}
      </div>
    </div>
  );
}