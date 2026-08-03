import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getBookmarksForUser } from '@/lib/cbtSessionStore';
import { questionStore } from '@/lib/questionStore';

const levelTone = {
  Mudah: 'bg-emerald-500/10 text-emerald-600',
  Sedang: 'bg-amber-500/10 text-amber-600',
  Sulit: 'bg-destructive/10 text-destructive',
};

export default function BookmarkedQuestions() {
  const { user } = useAuth();
  const [bookmarkIds, setBookmarkIds] = useState(() => getBookmarksForUser(user?.id));

  useEffect(() => {
    if (!user?.id) {
      setBookmarkIds([]);
      return undefined;
    }
    const updateBookmarks = () => setBookmarkIds(getBookmarksForUser(user.id));
    updateBookmarks();
    window.addEventListener('cbtBookmarksUpdated', updateBookmarks);
    return () => window.removeEventListener('cbtBookmarksUpdated', updateBookmarks);
  }, [user?.id]);

  const questionsById = new Map(questionStore.getQuestions().map((q) => [q.id, q]));
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
        {items.map((q) => (
          <div key={q.id} className="group flex items-start gap-3 rounded-xl border border-border p-3 transition-all hover:border-primary/40 hover:bg-accent">
            <Bookmark className="mt-0.5 h-4 w-4 shrink-0 fill-amber-400 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug">{q.pertanyaan}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{q.kategori}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${levelTone[q.tingkatKesulitan]}`}>
                  {q.tingkatKesulitan}
                </span>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
        ))}
      </div>
    </div>
  );
}