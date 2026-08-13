/* ===================================================
   INTERVIEW JOURNAL — Data Migration (Local to Supabase)
   =================================================== */

window.Migration = (() => {
  const MIGRATION_KEY = 'ij_migration_complete';

  async function run() {
    const isMigrated = localStorage.getItem(MIGRATION_KEY);
    if (isMigrated === 'true') {
      console.log('Migration already completed for this client.');
      return;
    }

    const user = Store.getUser();
    if (!user) {
      console.log('Cannot migrate: No authenticated user.');
      return;
    }

    console.log('Starting migration from localStorage to Supabase...');

    try {
      // 1. Read local data
      const localCompanies = JSON.parse(localStorage.getItem('ij_companies') || '[]');
      const localInterviews = JSON.parse(localStorage.getItem('ij_interviews') || '[]');
      const localQuestions = JSON.parse(localStorage.getItem('ij_questions') || '[]');

      if (localCompanies.length === 0 && localInterviews.length === 0 && localQuestions.length === 0) {
        console.log('No local data to migrate.');
        localStorage.setItem(MIGRATION_KEY, 'true');
        return;
      }

      const companyIdMap = {};   // oldId -> newId
      const interviewIdMap = {}; // oldId -> newId
      const topicIdMap = {};     // name -> newId

      // 2. Migrate Companies
      // If localCompanies is empty but we have interviews, extract unique companies
      if (localCompanies.length === 0 && localInterviews.length > 0) {
        const uniqueCompanyNames = [...new Set(localInterviews.map(i => i.company).filter(Boolean))];
        for (const name of uniqueCompanyNames) {
          localCompanies.push({ name, status: 'In Progress' }); // Generate mock company objects
        }
      }

      for (const comp of localCompanies) {
        // Skip dummy/seed data
        if (comp.id && comp.id.startsWith('seed-')) continue;
        
        const payload = {
          user_id: user.id,
          name: comp.name || 'Unnamed Company',
          location: comp.location || '',
          status: comp.status || 'In Progress',
          notes: comp.notes || '',
          created_at: comp.createdAt || new Date().toISOString(),
          updated_at: comp.updatedAt || new Date().toISOString()
        };

        const { data, error } = await window.SupabaseClient.from('companies').insert(payload).select().single();
        if (error) {
          console.error('Failed to migrate company:', comp.name, error);
          continue;
        }
        // Map both by ID (if it existed) and by Name
        if (comp.id) companyIdMap[comp.id] = data.id;
        companyIdMap[comp.name] = data.id;
      }

      // 3. Migrate Interviews
      for (const inv of localInterviews) {
        if (inv.id && inv.id.startsWith('seed-')) continue;
        
        // Old structure used `company` string, new might use `companyId`. Fallback to string match.
        const newCompanyId = companyIdMap[inv.companyId] || companyIdMap[inv.company];
        if (!newCompanyId) continue; // Orphaned

        const payload = {
          user_id: user.id,
          company_id: newCompanyId,
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
        };

        const { data, error } = await window.SupabaseClient.from('interview_rounds').insert(payload).select().single();
        if (error) {
          console.error('Failed to migrate interview:', inv.round, error);
          continue;
        }
        interviewIdMap[inv.id] = data.id;
      }

      // 4. Migrate Topics & Questions
      for (const q of localQuestions) {
        if (q.id && q.id.startsWith('seed-')) continue;
        if (q.id && q.id.startsWith('sq-')) continue; // seed questions
        
        const newInterviewId = interviewIdMap[q.interviewId];
        if (!newInterviewId) continue; // Orphaned

        const topicName = (q.topic || 'Uncategorized').trim();
        let topicId = topicIdMap[topicName];

        if (!topicId) {
          // Check or insert topic
          let { data: tData } = await window.SupabaseClient.from('topics').select('id').ilike('name', topicName).limit(1);
          if (tData && tData.length > 0) {
            topicId = tData[0].id;
          } else {
            const { data: newTData } = await window.SupabaseClient.from('topics').insert({ user_id: user.id, name: topicName }).select().single();
            if (newTData) topicId = newTData.id;
          }
          if (topicId) topicIdMap[topicName] = topicId;
        }

        const payload = {
          user_id: user.id,
          interview_id: newInterviewId,
          topic_id: topicId || null,
          question: q.question || '',
          status: q.status || 'Answered',
          notes: q.notes || '',
          created_at: new Date().toISOString()
        };

        await window.SupabaseClient.from('questions').insert(payload);
      }

      console.log('✅ Migration complete!');
      localStorage.setItem(MIGRATION_KEY, 'true');
      
    } catch (err) {
      console.error('Migration failed completely:', err);
    }
  }

  return { run };
})();
