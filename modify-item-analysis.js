const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/pages/TEACHER/ItemAnalysis.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add import
content = content.replace(
    'getItemAnalysisData,\n\tgetUploadMetaData,',
    'getItemAnalysisData,\n\tgetTeacherTosBlueprint,\n\tgetUploadMetaData,'
);

// 2. Add state variable
content = content.replace(
    'const [savingLinkedAnalysis, setSavingLinkedAnalysis] = useState(false);\n\tconst [selectedStudentId, setSelectedStudentId] = useState',
    'const [savingLinkedAnalysis, setSavingLinkedAnalysis] = useState(false);\n\tconst [availableCompetencies, setAvailableCompetencies] = useState<string[]>([]);\n\tconst [selectedStudentId, setSelectedStudentId] = useState'
);

// 3. Add function - find the mostLearnedItems useMemo and add function after it
const functionCode = `
	const applyCompetenciesToContentAreas = () => {
		if (availableCompetencies.length === 0) {
			setActionMessage('No competencies available from TOS Blueprint.');
			return;
		}

		const newEntries = [...analysisEntries];
		const allItems = [...mostLearnedItems, ...leastLearnedItems];
		
		allItems.forEach((item, index) => {
			const competency = availableCompetencies[index % availableCompetencies.length] || '';
			const existingIndex = newEntries.findIndex((e) => e.itemNumber === item.itemNo);
			
			if (existingIndex >= 0) {
				if (!newEntries[existingIndex].contentArea) {
					newEntries[existingIndex] = {
						...newEntries[existingIndex],
						contentArea: competency
					};
				}
			} else if (competency) {
				newEntries.push({
					itemNumber: item.itemNo,
					contentArea: competency,
					intervention: ''
				});
			}
		});

		setAnalysisEntries(newEntries);
		setActionMessage(\`Content areas populated with \${Math.min(allItems.length, availableCompetencies.length)} competencies from TOS Blueprint.\`);
	};
`;

content = content.replace(
    '\t}, [sortedByDifficulty]);\n\n\tconst leastLearnedItems = useMemo(() => {',
    '\t}, [sortedByDifficulty]);\n\n\tconst applyCompetenciesToContentAreas = () => {\n\t\tif (availableCompetencies.length === 0) {\n\t\t\tsetActionMessage(\'No competencies available from TOS Blueprint.\');\n\t\t\treturn;\n\t\t}\n\n\t\tconst newEntries = [...analysisEntries];\n\t\tconst allItems = [...mostLearnedItems, ...leastLearnedItems];\n\t\t\n\t\tallItems.forEach((item, index) => {\n\t\t\tconst competency = availableCompetencies[index % availableCompetencies.length] || \'\';\n\t\t\tconst existingIndex = newEntries.findIndex((e) => e.itemNumber === item.itemNo);\n\t\t\t\n\t\t\tif (existingIndex >= 0) {\n\t\t\t\tif (!newEntries[existingIndex].contentArea) {\n\t\t\t\t\tnewEntries[existingIndex] = {\n\t\t\t\t\t\t...newEntries[existingIndex],\n\t\t\t\t\t\tcontentArea: competency\n\t\t\t\t\t};\n\t\t\t\t}\n\t\t\t} else if (competency) {\n\t\t\t\tnewEntries.push({\n\t\t\t\t\titemNumber: item.itemNo,\n\t\t\t\t\tcontentArea: competency,\n\t\t\t\t\tintervention: \'\'\n\t\t\t\t});\n\t\t\t}\n\t\t});\n\n\t\tsetAnalysisEntries(newEntries);\n\t\tsetActionMessage(`Content areas populated with ${Math.min(allItems.length, availableCompetencies.length)} competencies from TOS Blueprint.`);\n\t};\n\n\tconst leastLearnedItems = useMemo(() => {'
);

// 4. Add useEffect to load competencies
const useEffectCode = `
	useEffect(() => {
		const loadCompetencies = async () => {
			const classToken = appliedClass || selectedClass;
			const subjectToken = appliedSubject || selectedSubject;
			const quarterToken = appliedQuarter || selectedQuarter;

			if (!classToken || !subjectToken || !quarterToken) {
				setAvailableCompetencies([]);
				return;
			}

			try {
				const blueprint = await getTeacherTosBlueprint({
					schoolYear: 'N/A',
					classValue: classToken,
					subject: subjectToken,
					quarter: quarterToken
				});

				if (blueprint && blueprint.rows) {
					const competencies = blueprint.rows
						.map((row) => row.competency)
						.filter((comp) => comp && comp.trim().length > 0);
					setAvailableCompetencies(competencies);
				} else {
					setAvailableCompetencies([]);
				}
			} catch {
				setAvailableCompetencies([]);
			}
		};

		void loadCompetencies();
	}, [appliedClass, appliedSubject, appliedQuarter, selectedClass, selectedSubject, selectedQuarter]);
`;

content = content.replace(
    '\t}, [selectedScope, sortedIndividualStudents, selectedStudentId]);\n\n\tconst handleSaveAnalysisEntries = () => {',
    '\t}, [selectedScope, sortedIndividualStudents, selectedStudentId]);\n' + useEffectCode + '\n\tconst handleSaveAnalysisEntries = () => {'
);

// 5. Add button
content = content.replace(
    '\t\t\t</button>\n\t\t\t<button\n\t\t\t\ttype="button"\n\t\t\t\tclassName="teacher-filter-apply-btn"\n\t\t\t\tonClick={handleSaveAnalysisEntries}',
    '\t\t\t</button>\n\t\t\t<button\n\t\t\t\ttype="button"\n\t\t\t\tclassName="teacher-filter-apply-btn"\n\t\t\t\tonClick={applyCompetenciesToContentAreas}\n\t\t\t\tdisabled={availableCompetencies.length === 0}\n\t\t\t\ttitle={availableCompetencies.length === 0 ? \'No competencies available from TOS Blueprint\' : \'Apply competencies from TOS Blueprint to content areas\'}\n\t\t\t>\n\t\t\t\tApply TOS Competencies\n\t\t\t</button>\n\t\t\t<button\n\t\t\t\ttype="button"\n\t\t\t\tclassName="teacher-filter-apply-btn"\n\t\t\t\tonClick={handleSaveAnalysisEntries}'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ ItemAnalysis.tsx successfully updated!');
