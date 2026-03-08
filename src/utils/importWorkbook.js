import * as XLSX from 'xlsx';

/**
 * Reads an Excel file and parses its sheets into GymPlanner data formats.
 * @param {File} file 
 * @returns {Promise<Object>} Object containing parsed data for various sections
 */
export async function importPlannerWorkbook(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const result = {
                    sessionTitles: null,
                    workoutRows: null,
                    completion: null,
                    exerciseRows: null,
                };

                // 1. Sessions Tab
                if (workbook.SheetNames.includes('Sessions')) {
                    const sheet = workbook.Sheets['Sessions'];
                    const rows = XLSX.utils.sheet_to_json(sheet);
                    const am = {};
                    const pm = {};
                    rows.forEach(row => {
                        const day = row['Day'];
                        if (day) {
                            am[day] = row['AM Session Title'] || '';
                            pm[day] = row['PM Session Title'] || '';
                        }
                    });
                    result.sessionTitles = { am, pm };
                }

                // 2. Workouts Tab
                if (workbook.SheetNames.includes('Workouts')) {
                    const sheet = workbook.Sheets['Workouts'];
                    const rows = XLSX.utils.sheet_to_json(sheet);
                    result.workoutRows = rows.map(row => ({
                        day: row['Day'] || '',
                        session: String(row['Session'] || '').toLowerCase(),
                        groupIndex: String(row['Group Index'] || '1'),
                        rowIndex: String(row['Row Index'] || '1'),
                        muscle: row['Muscle'] || '',
                        subMuscle: row['Sub Muscle'] || '',
                        exercise: row['Exercise'] || '',
                        sets: row['Sets'] || '',
                        reps: row['Reps'] || '',
                        weight: row['Weight'] || '',
                        dropSets: row['Drop Sets'] || '',
                        dropWeight: row['Drop Weight'] || '',
                    }));
                }

                // 3. Completion Tab
                if (workbook.SheetNames.includes('Completion')) {
                    const sheet = workbook.Sheets['Completion'];
                    const rows = XLSX.utils.sheet_to_json(sheet);
                    const completion = {};
                    rows.forEach(row => {
                        const day = row['Day'];
                        if (day) {
                            const parseStatus = (val) => {
                                if (val === 'Done') return true;
                                if (val === 'Skipped') return 'skipped';
                                return null;
                            };
                            const amVal = parseStatus(row['AM']);
                            const pmVal = parseStatus(row['PM']);
                            if (amVal !== null) completion[`${day}_am`] = amVal;
                            if (pmVal !== null) completion[`${day}_pm`] = pmVal;
                        }
                    });
                    result.completion = completion;
                }

                // 4. ExerciseDB Tab
                if (workbook.SheetNames.includes('ExerciseDB')) {
                    const sheet = workbook.Sheets['ExerciseDB'];
                    const rows = XLSX.utils.sheet_to_json(sheet);
                    result.exerciseRows = rows.map(row => ({
                        muscle: row['Muscle'] || '',
                        subMuscle: row['Sub Muscle'] || '',
                        exercise: row['Exercise'] || '',
                    }));
                }

                resolve(result);
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
}
