import { useState, useEffect } from 'react';
import { questionStore } from '@/lib/questionStore';

export function useQuestions() {
  const [qs, setQs] = useState(questionStore.getQuestions());
  useEffect(() => questionStore.subscribe(() => setQs(questionStore.getQuestions())), []);
  return qs;
}

export function useHistory() {
  const [h, setH] = useState(questionStore.getHistory());
  useEffect(() => questionStore.subscribe(() => setH(questionStore.getHistory())), []);
  return h;
}