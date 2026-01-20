export const healthIssuesData = [
    {
        id: 1,
        studentName: 'Jane Smith',
        roomNo: '102',
        studentPhone: '234-567-8901',
        parentPhone: '876-543-2109',
        complaint: 'Fever and headache',
        severity: 'Medium',
        reportedDate: '2026-01-19',
        status: 'Under Observation',
        temperature: '101°F',
        medicationGiven: 'Paracetamol',
        remarks: 'Advised rest for 2 days'
    },
    {
        id: 2,
        studentName: 'Chris Wilson',
        roomNo: '104',
        studentPhone: '567-890-1234',
        parentPhone: '543-210-9876',
        complaint: 'Stomach pain',
        severity: 'Low',
        reportedDate: '2026-01-20',
        status: 'Recovered',
        temperature: 'Normal',
        medicationGiven: 'Antacid',
        remarks: 'Feeling better'
    }
];

export const healthStats = {
    totalCases: 2,
    underObservation: 1,
    recovered: 1,
    critical: 0
};
