import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { BASE_URL, API_ENDPOINTS } from '../../../../shared/constants/api.config';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const currentUserName = () =>
  localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'You';

const CandidateDetailsView = ({ candidate, onClose }) => {
  const fullData = candidate.fullData || candidate;
  const candidateId = fullData.id;
  const name = fullData.name || 'Unknown Candidate';
  const email = fullData.email || 'Not provided';
  const role = fullData.role || 'Not specified';
  const stage = fullData.stage || 'Applied';
  const skills = fullData.skills || '';
  const resumeUrl = fullData.resume_url || '';

  const [notes, setNotes] = useState(fullData.notes || '');
  const [recruiterComments, setRecruiterComments] = useState(fullData.recruiter_comments || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(true);

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const skillsList = skills ? (Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim())) : [];

  const avatar = name.charAt(0).toUpperCase() || '?';

  const getStageColor = () => {
    switch (stage) {
      case 'Hired': return 'bg-emerald-50 text-emerald-700';
      case 'Rejected': return 'bg-rose-50 text-rose-700';
      case 'Interview': return 'bg-indigo-50 text-indigo-700';
      case 'Offer': return 'bg-primary/10 text-primary';
      default: return 'bg-primary/10 text-primary';
    }
  };

  const handleDownload = () => {
    if (resumeUrl) {
      const backendBaseUrl = BASE_URL;
      let downloadUrl;

      if (resumeUrl.startsWith('http')) {
        downloadUrl = resumeUrl;
      } else if (resumeUrl.startsWith('/uploads/')) {
        downloadUrl = `${backendBaseUrl}${resumeUrl}`;
      } else if (resumeUrl.startsWith('uploads/')) {
        downloadUrl = `${backendBaseUrl}/${resumeUrl}`;
      } else {
        downloadUrl = `${backendBaseUrl}/uploads/${resumeUrl}`;
      }

      window.open(downloadUrl, "_blank");
    }
  };

  const fetchComments = useCallback(async () => {
    if (!candidateId) return;
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const res = await fetch(
        `${BASE_URL}${API_ENDPOINTS.PIPELINE.CANDIDATE_COMMENTS(candidateId)}`,
        { headers: { ...authHeaders() } }
      );
      if (!res.ok) throw new Error('Failed to load comments');
      const data = await res.json();
      setComments(data);
    } catch (err) {
      setCommentsError(err.message || 'Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !candidateId) return;
    setPostingComment(true);
    try {
      const res = await fetch(
        `${BASE_URL}${API_ENDPOINTS.PIPELINE.CANDIDATE_COMMENTS(candidateId)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ author: currentUserName(), text: newComment.trim() }),
        }
      );
      if (!res.ok) throw new Error('Failed to post comment');
      setNewComment('');
      fetchComments();
    } catch (err) {
      setCommentsError(err.message || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!candidateId) return;
    setSavingNotes(true);
    try {
      const res = await fetch(
        `${BASE_URL}${API_ENDPOINTS.PIPELINE.CANDIDATE(candidateId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ notes, recruiter_comments: recruiterComments }),
        }
      );
      if (!res.ok) throw new Error('Failed to save notes');
      setNotesSaved(true);
    } catch (err) {
      setCommentsError(err.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white text-base font-bold uppercase">
          {avatar}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-base font-bold text-midnight_text">{name}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getStageColor()}`}>
              {stage}
            </span>
          </div>
          <p className="text-xs text-gray-500">{email}</p>
        </div>
      </div>

      <div className="bg-gray-50 px-3 py-2 rounded-lg">
        <p className="text-xs text-gray-500 mb-0.5">Applied for</p>
        <p className="text-sm font-medium text-midnight_text">{role}</p>
      </div>

      {skillsList.length > 0 && skillsList[0] !== '' && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {skillsList.map((skill, index) => (
              <span key={index} className="px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                {skill.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-amber-50/30 px-3 py-2 rounded-lg border border-amber-100">
        <p className="text-xs text-amber-700 font-medium mb-1 flex items-center gap-1">
          <Icon icon="heroicons:document-text" className="h-3 w-3" />
          Notes
        </p>
        <textarea
          className="w-full text-sm text-gray-700 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-amber-200 rounded resize-none"
          rows={2}
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
          placeholder="Add a note about this candidate..."
        />
      </div>

      <div className="bg-blue-50/30 px-3 py-2 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-700 font-medium mb-1 flex items-center gap-1">
          <Icon icon="heroicons:chat-bubble-left-right" className="h-3 w-3" />
          Recruiter Comments
        </p>
        <textarea
          className="w-full text-sm text-gray-700 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-200 rounded resize-none"
          rows={2}
          value={recruiterComments}
          onChange={(e) => { setRecruiterComments(e.target.value); setNotesSaved(false); }}
          placeholder="Add a recruiter comment..."
        />
      </div>

      {!notesSaved && (
        <div className="flex justify-end">
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="px-3 py-1 bg-primary text-white rounded-md text-xs font-medium disabled:opacity-50"
          >
            {savingNotes ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      )}

      <div>
        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
          <Icon icon="heroicons:chat-bubble-left-ellipsis" className="h-3 w-3" />
          Comment Thread
        </p>

        {commentsLoading && <p className="text-xs text-gray-400">Loading comments...</p>}
        {commentsError && <p className="text-xs text-rose-600">{commentsError}</p>}

        {!commentsLoading && comments.length === 0 && (
          <p className="text-xs text-gray-400">No comments yet.</p>
        )}

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="bg-gray-50 px-3 py-2 rounded-lg">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-midnight_text">{c.author}</span>
                <span className="text-[10px] text-gray-400">
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">{c.text}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            className="flex-1 text-sm px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(); }}
          />
          <button
            onClick={handlePostComment}
            disabled={postingComment || !newComment.trim()}
            className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-medium disabled:opacity-50"
          >
            {postingComment ? '...' : 'Post'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={onClose}
          className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-all"
        >
          Close
        </button>
        {resumeUrl && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-medium transition-all shadow-sm"
          >
            <Icon icon="heroicons:arrow-down-tray" className="h-3.5 w-3.5" />
            Resume
          </button>
        )}
      </div>
    </div>
  );
};

export default CandidateDetailsView;