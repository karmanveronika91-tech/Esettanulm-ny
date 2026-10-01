import mammoth from 'mammoth';

export async function parseDocxFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // If it's a plain text file or markdown
  if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    return await file.text();
  }

  // If it's a .docx file
  if (fileName.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  }

  // Fallback for other text formats
  try {
    const text = await file.text();
    if (text && text.trim().length > 0) {
      return text.trim();
    }
  } catch (err) {
    console.warn('Fallback text read error:', err);
  }

  throw new Error(
    'Csak .docx (Word dokumentum) vagy szöveges fájlok tölthetők fel. Kérjük, mentsd el a fájlt .docx formátumban!'
  );
}
