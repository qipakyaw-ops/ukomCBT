import React, { useEffect, useState } from 'react';
import { Bookmark, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import CbtPageShell from '@/components/cbt/CbtPageShell';
import { getBookmarksForUser, removeBookmark } from '@/lib/cbtSessionStore';
import { questionStore } from '@/lib/questionStore';

export default function Bookmarks() {
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
  const items = bookmarkIds.map((id) => questionsById.get(id)).filter(Boolean);

  const removeBookmarkItem = (questionId) => {
    if (!user?.id) return;
    removeBookmark(user.id, questionId);
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
        {items.map((q) => (
          <div key={q.id} className="group flex items-start gap-3 rounded-xl border border-border p-3 transition-all hover:border-primary/40 hover:bg-accent">
            <Bookmark className="mt-0.5 h-4 w-4 shrink-0 fill-amber-400 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug">{q.pertanyaan}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{q.kategori}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${q.tingkatKesulitan === 'Mudah' ? 'bg-emerald-500/10 text-emerald-600' : q.tingkatKesulitan === 'Sedang' ? 'bg-amber-500/10 text-amber-600' : 'bg-destructive/10 text-destructive'}`}>
                  {q.tingkatKesulitan}
                </span>
              </div>
            </div>
            <button onClick={() => removeBookmarkItem(q.id)} className="rounded-md p-2 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </CbtPageShell>
  );
}
