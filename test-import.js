const fs = require('fs');
const jsonData = fs.readFileSync('/Users/harishankargiri/MyProject/InterviewTracker/interviews_json/interview-journal-2026-08-06.json', 'utf8');

const Utils = { uuid: () => 'id-' + Math.random().toString(36).substr(2, 9) };

const data = JSON.parse(jsonData);

if (data.version === 1 || (!data.companies && data.interviews)) {
  console.log("V1 Format Detected.");
  
  const v1Interviews = data.interviews || [];
  const v1Questions = data.questions || [];
  
  const uniqueCompanyNames = [...new Set(v1Interviews.map(i => i.company).filter(Boolean))];
  const companies = [];
  const companyIdMap = {};
  
  for (const name of uniqueCompanyNames) {
    const id = Utils.uuid();
    companies.push({ id, name, location: '', status: 'In Progress', notes: '' });
    companyIdMap[name] = id;
  }
  
  const interviews = [];
  for (const inv of v1Interviews) {
    const compId = companyIdMap[inv.company];
    if (!compId) continue;
    interviews.push({
      id: inv.id,
      company_id: compId,
      round: inv.round
    });
  }
  
  console.log("Extracted Companies:", companies.length);
  console.log(companies.map(c => c.name));
  console.log("Extracted Interviews:", interviews.length);
} else {
  console.log("V2 Format Detected.");
}
