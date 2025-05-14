export const readCSVFile = async () => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const lines = reader.result.trim().split('\n').slice(1); // Skip header
          const data = lines.map(line => {
            const [date, income, expense] = line.split(',');
            return {
              date: date.trim(),
              income: parseFloat(income) || 0,
              expense: parseFloat(expense) || 0
            };
          });
          resolve(data);
        };
        reader.readAsText(file);
      };
      input.click();
    });
  };
  
  export const writeCSVFile = async (data) => {
    const header = 'date,income,expense\n';
    const csv = header + data.map(row => `${row.date},${row.income},${row.expense}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const handle = await window.showSaveFilePicker({
      suggestedName: 'expenses.csv',
      types: [{ description: 'CSV Files', accept: { 'text/csv': ['.csv'] } }]
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  };
  
  export const createCSVFile = async () => {
    const header = 'date,income,expense\n';
    const blob = new Blob([header], { type: 'text/csv' });
    const handle = await window.showSaveFilePicker({
      suggestedName: 'expenses.csv',
      types: [{ description: 'CSV Files', accept: { 'text/csv': ['.csv'] } }]
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  };
  