import { useState, useCallback } from 'react';
import questionClient from '@/api/questionClient.js';
import { questionStore } from '@/lib/questionStore.js';

const USE_API = true;

export function useQuestionAPI() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalItems: 0, totalPages: 0, itemsPerPage: 20 });

  // Stable identity so consumers can safely include fetchQuestions in effect deps
  // without re-triggering on every render.
  const fetchQuestions = useCallback(async (filters = {}) => {
    if (!USE_API) {
      setQuestions(questionStore.getQuestions());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await questionClient.getQuestions(filters);
      setQuestions(result.questions);
      // Only update pagination metadata; the active page state lives in the caller.
      if (result.pagination) setPagination(result.pagination);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setError(err.message);
      setQuestions(questionStore.getQuestions());
    } finally {
      setLoading(false);
    }
  }, []);

  const createQuestion = async (questionData) => {
    if (!USE_API) {
      return questionStore.addQuestion(questionData);
    }

    try {
      const newQuestion = await questionClient.createQuestion(questionData);
      setQuestions(prev => [newQuestion, ...prev]);
      return newQuestion;
    } catch (err) {
      console.error('Failed to create question:', err);
      throw err;
    }
  };

  const updateQuestion = async (id, questionData) => {
    if (!USE_API) {
      questionStore.updateQuestion(id, questionData);
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...questionData } : q));
      return;
    }

    try {
      const updatedQuestion = await questionClient.updateQuestion(id, questionData);
      setQuestions(prev => prev.map(q => q.id === id ? updatedQuestion : q));
      return updatedQuestion;
    } catch (err) {
      console.error('Failed to update question:', err);
      throw err;
    }
  };

  const deleteQuestion = async (id) => {
    if (!USE_API) {
      questionStore.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      return;
    }

    try {
      await questionClient.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error('Failed to delete question:', err);
      throw err;
    }
  };

  return {
    questions,
    loading,
    error,
    pagination,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
  };
}
