/* ===================================================
   INTERVIEW JOURNAL — Data Store (IndexedDB Local Only)
   =================================================== */

window.Store = (() => {
  const KEYS = {
    SETTINGS: 'ij_settings',
    AUTH: 'ij_auth_user'
  };

  let currentUser = null;

  // ── Auth ─────────────────────────────────────────────
  async function initAuth() {
    try {
      const stored = localStorage.getItem(KEYS.AUTH);
      if (stored) {
        currentUser = JSON.parse(stored);
      }
    } catch {
      currentUser = null;
    }

    if (!currentUser) {
      window.location.hash = 'auth';
    }
    
    // Watch for manual hash changes while logged out
    window.addEventListener('hashchange', () => {
      if (!currentUser && window.location.hash !== '#auth') {
        Router.replace('auth');
      } else if (currentUser && window.location.hash === '#auth') {
        Router.replace('home');
      }
    });

    return currentUser;
  }

  function getUser() {
    return currentUser;
  }

  async function login(username, password) {
    if (username === 'hsgiri' && password === 'hsgiri') {
      const user = { id: 'local-user-1', username: 'hsgiri' };
      localStorage.setItem(KEYS.AUTH, JSON.stringify(user));
      currentUser = user;
      return user;
    }
    throw new Error('Invalid username or password.');
  }

  async function logout() {
    localStorage.removeItem(KEYS.AUTH);
    currentUser = null;
  }

  // Unsupported auth endpoints for local prototype
  async function signup() { throw new Error('Signup disabled in local prototype.'); }
  async function resetPassword() { throw new Error('Reset disabled in local prototype.'); }

  // ── Companies ───────────────────────────────────────
  async function getAllCompaniesRaw() {
    const data = await DB.getAll('companies');
    return data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  async function getCompany(id) {
    return DB.get('companies', id);
  }
  
  async function getCompanyByName(name) {
    if (!name) return null;
    const all = await DB.getAll('companies');
    const match = all.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
    return match || null;
  }

  async function saveCompany(companyData) {
    const now = new Date().toISOString();
    const payload = {
      id: companyData.id || Utils.uuid(),
      name: companyData.name || '',
      location: companyData.location || '',
      status: companyData.status || 'In Progress',
      notes: companyData.notes || '',
      updated_at: now
    };
    if (!companyData.id) payload.created_at = now;
    
    await DB.put('companies', payload);
    return payload.id;
  }

  async function deleteCompany(id) {
    await DB.remove('companies', id);
    return true;
  }

  // ── Interviews (Rounds) ─────────────────────────────
  async function getAllInterviews() {
    const companies = await DB.getAll('companies');
    const compMap = {};
    companies.forEach(c => compMap[c.id] = c.name);

    const data = await DB.getAll('interview_rounds');
    return data
      .map(i => ({ ...i, company: compMap[i.company_id] || '' }))
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }

  async function getInterview(id) {
    const local = await DB.get('interview_rounds', id);
    if (local) {
      const comp = await DB.get('companies', local.company_id);
      return { ...local, company: comp ? comp.name : '' };
    }
    return null;
  }

  async function saveInterview(interviewData) {
    const now = new Date().toISOString();
    
    let comp = await getCompanyByName(interviewData.company);
    if (!comp) {
      const cId = await saveCompany({
        name: interviewData.company,
        location: interviewData.location || '',
        status: 'In Progress'
      });
      comp = { id: cId, name: interviewData.company };
    }

    const payload = {
      id: interviewData.id || Utils.uuid(),
      company_id: comp.id,
      date: interviewData.date || null,
      time: interviewData.time || '',
      round: interviewData.round || '',
      interviewer: interviewData.interviewer || '',
      duration: interviewData.duration || 60,
      mode: interviewData.mode || 'Video',
      location: interviewData.location || '',
      confidence: interviewData.confidence || 5,
      difficulty: interviewData.difficulty || 5,
      outcome: interviewData.outcome || 'Pending',
      notes: interviewData.notes || '',
      updated_at: now
    };
    if (!interviewData.id) payload.created_at = now;

    await DB.put('interview_rounds', payload);
    return payload.id;
  }

  async function deleteInterview(id) {
    await DB.remove('interview_rounds', id);
    return true;
  }

  // ── Questions & Topics ────────────────────────────────
  
  async function ensureTopic(topicName) {
    if (!topicName) return null;
    const name = topicName.trim();
    
    const all = await DB.getAll('topics');
    const match = all.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (match) return match.id;
    
    const newId = Utils.uuid();
    await DB.put('topics', {
      id: newId,
      name: name
    });
    return newId;
  }

  async function getAllQuestions() {
    const topics = await DB.getAll('topics');
    const topicMap = {};
    topics.forEach(t => topicMap[t.id] = t.name);
    
    const rounds = await DB.getAll('interview_rounds');
    const roundMap = {};
    rounds.forEach(r => roundMap[r.id] = r.company_id);
    
    const companies = await DB.getAll('companies');
    const compMap = {};
    companies.forEach(c => compMap[c.id] = c.name);

    const data = await DB.getAll('questions');
    return data
      .map(q => ({
        ...q,
        topic: topicMap[q.topic_id] || '',
        company: compMap[roundMap[q.interview_id]] || ''
      }))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  async function getQuestionsByInterview(interviewId) {
    const all = await getAllQuestions();
    return all.filter(q => q.interview_id === interviewId).map(q => ({
      ...q, interviewId: q.interview_id
    }));
  }

  async function saveQuestion(qData) {
    const topicId = await ensureTopic(qData.topic);
    
    const payload = {
      id: qData.id || Utils.uuid(),
      interview_id: qData.interviewId,
      topic_id: topicId,
      question: qData.question || '',
      status: qData.status || 'Answered',
      notes: qData.notes || '',
      created_at: new Date().toISOString()
    };

    await DB.put('questions', payload);
    return payload.id;
  }

  async function saveQuestions(interviewId, questionsData) {
    // Mark old as deleted
    const oldQs = await getQuestionsByInterview(interviewId);
    for (const q of oldQs) {
      await deleteQuestion(q.id);
    }
    
    for (const q of questionsData) {
      q.interviewId = interviewId;
      q.id = undefined; // Force new inserts
      await saveQuestion(q);
    }
  }

  async function deleteQuestion(id) {
    await DB.remove('questions', id);
    return true;
  }

  // ── Stats ───────────────────────────────────────────
  async function getStats() {
    const [interviews, questions, companies] = await Promise.all([
      DB.getAll('interview_rounds'),
      DB.getAll('questions'),
      DB.getAll('companies')
    ]);
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thisMonthCount = interviews.filter(i => i.date >= startOfMonth).length;

    return {
      totalInterviews: interviews.length,
      totalQuestions: questions.length,
      totalCompanies: companies.length,
      thisMonthCount,
    };
  }

  // ── Settings & Backup ──────────────────────────────────
  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.SETTINGS) || '{"theme":"system"}');
    } catch { return { theme: 'system' }; }
  }

  function saveSettings(data) {
    const settings = getSettings();
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...settings, ...data }));
  }

  async function exportData() {
    if (!currentUser) throw new Error('Must be logged in to export.');
    const [companies, interviews, questions, topics] = await Promise.all([
      DB.getAll('companies'),
      DB.getAll('interview_rounds'),
      DB.getAll('questions'),
      DB.getAll('topics')
    ]);

    const data = {
      version: 2,
      timestamp: new Date().toISOString(),
      companies,
      interviews,
      questions,
      topics
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `InterviewTracker_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  }

  async function importData(jsonData) {
    if (!currentUser) throw new Error('Must be logged in to import.');
    const data = JSON.parse(jsonData);
    
    // Clear current IndexedDB entirely to ensure a clean slate
    await clearAllData();

    // V1 Backward Compatibility
    if (data.version === 1 || (!data.companies && data.interviews)) {
      const v1Interviews = data.interviews || [];
      const v1Questions = data.questions || [];
      
      // 1. Extract unique companies from interviews
      const uniqueCompanyNames = [...new Set(v1Interviews.map(i => i.company).filter(Boolean))];
      const companies = [];
      const companyIdMap = {};
      
      for (const name of uniqueCompanyNames) {
        const id = Utils.uuid();
        companies.push({ id, name, location: '', status: 'In Progress', notes: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        companyIdMap[name] = id;
      }
      
      // 2. Map interviews to new companies
      const interviews = [];
      for (const inv of v1Interviews) {
        const compId = companyIdMap[inv.company];
        if (!compId) continue;
        interviews.push({
          id: inv.id,
          company_id: compId,
          date: inv.date || null,
          time: inv.time || '',
          round: inv.round || '',
          interviewer: inv.interviewer || '',
          duration: inv.duration || 60,
          mode: inv.mode || 'Video',
          location: inv.location || '',
          confidence: inv.confidence || 5,
          difficulty: inv.difficulty || 5,
          outcome: inv.outcome || 'Pending',
          notes: inv.notes || '',
          created_at: inv.createdAt || new Date().toISOString(),
          updated_at: inv.updatedAt || new Date().toISOString()
        });
      }
      
      // 3. Extract unique topics from questions
      const uniqueTopicNames = [...new Set(v1Questions.map(q => q.topic).filter(Boolean))];
      const topics = [];
      const topicIdMap = {};
      for (const name of uniqueTopicNames) {
        const id = Utils.uuid();
        topics.push({ id, name });
        topicIdMap[name] = id;
      }
      
      // 4. Map questions
      const questions = [];
      for (const q of v1Questions) {
        questions.push({
          id: q.id,
          interview_id: q.interviewId,
          topic_id: topicIdMap[q.topic] || null,
          question: q.question || '',
          status: q.status || 'Answered',
          notes: q.notes || '',
          created_at: new Date().toISOString()
        });
      }
      
      if (companies.length > 0) await DB.putAll('companies', companies);
      if (interviews.length > 0) await DB.putAll('interview_rounds', interviews);
      if (topics.length > 0) await DB.putAll('topics', topics);
      if (questions.length > 0) await DB.putAll('questions', questions);
      
      window.dispatchEvent(new CustomEvent('data-updated', { detail: 'import_complete' }));
      return true;
    }

    // V2 Normal Import
    if (!data.companies || !data.interviews) throw new Error("Invalid backup format.");
    
    if (data.companies.length > 0) await DB.putAll('companies', data.companies);
    if (data.interviews.length > 0) await DB.putAll('interview_rounds', data.interviews);
    if (data.topics && data.topics.length > 0) await DB.putAll('topics', data.topics);
    if (data.questions && data.questions.length > 0) await DB.putAll('questions', data.questions);
    
    window.dispatchEvent(new CustomEvent('data-updated', { detail: 'import_complete' }));
    return true;
  }

  async function clearAllData() {
    await Promise.all([
      DB.clear('companies'),
      DB.clear('interview_rounds'),
      DB.clear('questions'),
      DB.clear('topics'),
      DB.clear('sync_queue')
    ]);
  }

  // ── Search ──────────────────────────────────────────
  async function search(query) {
    if (!query || query.length < 1) return { interviews: [], questions: [], companies: [] };
    const q = query.toLowerCase();
    
    const [allComps, allInts, allQs] = await Promise.all([
      getAllCompaniesRaw(),
      getAllInterviews(),
      getAllQuestions()
    ]);
    
    const companies = allComps.filter(c => c.name.toLowerCase().includes(q)).slice(0, 5);
    const interviews = allInts.filter(i => 
      (i.company && i.company.toLowerCase().includes(q)) ||
      (i.round && i.round.toLowerCase().includes(q)) ||
      (i.interviewer && i.interviewer.toLowerCase().includes(q)) ||
      (i.notes && i.notes.toLowerCase().includes(q))
    ).slice(0, 5);
    
    const questions = allQs.filter(qu => 
      (qu.question && qu.question.toLowerCase().includes(q)) ||
      (qu.notes && qu.notes.toLowerCase().includes(q))
    ).slice(0, 5);

    return { 
      interviews, 
      questions, 
      companies: companies.map(c => c.name) 
    };
  }

  // ── Company-level derived methods ────────────────────
  async function getCompanies() {
    const [companies, interviews, questions] = await Promise.all([
      getAllCompaniesRaw(),
      getAllInterviews(),
      getAllQuestions()
    ]);

    const qCountMap = {};
    questions.forEach(q => {
      if (q.interview_id) qCountMap[q.interview_id] = (qCountMap[q.interview_id] || 0) + 1;
    });

    return companies.map(c => {
      const rounds = interviews.filter(i => i.company_id === c.id);
      const sortedRounds = rounds.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      const totalQuestions = rounds.reduce((sum, r) => sum + (qCountMap[r.id] || 0), 0);
      
      return {
        ...c,
        key: c.name.toLowerCase(),
        rounds: sortedRounds,
        totalQuestions,
        latestDate: sortedRounds[0]?.date || null,
        overallStatus: c.status,
        latestLocation: c.location
      };
    }).sort((a, b) => new Date(b.latestDate || 0) - new Date(a.latestDate || 0));
  }

  async function getCompanyRounds(companyName) {
    if (!companyName) return [];
    const c = await getCompanyByName(companyName);
    if (!c) return [];
    
    const allInts = await getAllInterviews();
    return allInts.filter(i => i.company_id === c.id).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }

  async function companyExists(name) {
    return !!(await getCompanyByName(name));
  }

  async function findCompany(name) {
    const c = await getCompanyByName(name);
    return c ? c.name : null;
  }
  
  function seedIfEmpty() {
    // Disabled.
  }

  return {
    initAuth, getUser, login, signup, resetPassword, logout,
    getAllInterviews, getInterview, saveInterview, deleteInterview,
    getAllQuestions, getQuestionsByInterview, saveQuestion, saveQuestions, deleteQuestion,
    getStats, getSettings, saveSettings,
    exportData, importData, clearAllData,
    getCompany, getCompanyByName, saveCompany, deleteCompany,
    getCompanies, getCompanyRounds, companyExists, findCompany,
    search, seedIfEmpty,
  };
})();
