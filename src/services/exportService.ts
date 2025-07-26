import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Book, AudiobookData } from '../types';

export const exportToPDF = async (book: Book): Promise<void> => {
  const pdf = new jsPDF();
  let yPosition = 20;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;
  const maxWidth = pdf.internal.pageSize.width - 2 * margin;

  // Helper function to add text with word wrapping
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    pdf.setFontSize(fontSize);
    if (isBold) {
      pdf.setFont(undefined, 'bold');
    } else {
      pdf.setFont(undefined, 'normal');
    }

    const lines = pdf.splitTextToSize(text, maxWidth);
    
    for (const line of lines) {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += lineHeight;
    }
    
    yPosition += lineHeight / 2; // Add some spacing
  };

  // Add title page
  pdf.setFontSize(24);
  pdf.setFont(undefined, 'bold');
  pdf.text(book.title, margin, yPosition);
  yPosition += 15;

  pdf.setFontSize(14);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Genre: ${book.genre}`, margin, yPosition);
  yPosition += 10;
  pdf.text(`Target Audience: ${book.targetAudience}`, margin, yPosition);
  yPosition += 15;

  addText(book.description, 12);
  yPosition += 20;

  // Add table of contents
  addText('Table of Contents', 18, true);
  yPosition += 10;

  book.chapters.forEach((chapter, index) => {
    addText(`${index + 1}. ${chapter.title}`, 12);
  });

  yPosition += 20;

  // Add chapters
  book.chapters.forEach((chapter, chapterIndex) => {
    // Add new page for each chapter
    if (chapterIndex > 0) {
      pdf.addPage();
      yPosition = margin;
    }

    addText(`Chapter ${chapterIndex + 1}: ${chapter.title}`, 16, true);
    addText(chapter.description, 12);
    yPosition += 10;

    // Add sub-chapters
    if (chapter.subChapters) {
      chapter.subChapters.forEach((subChapter, subIndex) => {
        addText(`${chapterIndex + 1}.${subIndex + 1} ${subChapter.title}`, 14, true);
        addText(subChapter.description, 12);
        
        if (subChapter.content) {
          addText(subChapter.content, 11);
        }
        
        yPosition += 10;
      });
    }
  });

  // Save the PDF
  pdf.save(`${book.title}.pdf`);
};

export const exportToEPUB = async (book: Book): Promise<void> => {
  const zip = new JSZip();

  // Create EPUB structure
  zip.file('mimetype', 'application/epub+zip');

  // META-INF folder
  const metaInf = zip.folder('META-INF');
  metaInf?.file('container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  // OEBPS folder
  const oebps = zip.folder('OEBPS');

  // Create content.opf
  let manifestItems = '';
  let spineItems = '';
  let navPoints = '';

  // Add title page
  manifestItems += '    <item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>\n';
  spineItems += '    <itemref idref="titlepage"/>\n';

  // Add table of contents
  manifestItems += '    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml"/>\n';
  spineItems += '    <itemref idref="toc"/>\n';

  // Add chapters
  book.chapters.forEach((chapter, index) => {
    const chapterId = `chapter${index + 1}`;
    manifestItems += `    <item id="${chapterId}" href="${chapterId}.xhtml" media-type="application/xhtml+xml"/>\n`;
    spineItems += `    <itemref idref="${chapterId}"/>\n`;
    navPoints += `    <navPoint id="navpoint-${index + 1}" playOrder="${index + 3}">
      <navLabel><text>Chapter ${index + 1}: ${chapter.title}</text></navLabel>
      <content src="${chapterId}.xhtml"/>
    </navPoint>\n`;
  });

  const contentOpf = `<?xml version="1.0" encoding="utf-8"?>
<package version="2.0" unique-identifier="BookId" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${book.title}</dc:title>
    <dc:creator>AI Generated</dc:creator>
    <dc:subject>${book.genre}</dc:subject>
    <dc:description>${book.description}</dc:description>
    <dc:language>en</dc:language>
    <dc:identifier id="BookId">${Date.now()}</dc:identifier>
  </metadata>
  <manifest>
${manifestItems}    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>
  <spine toc="ncx">
${spineItems}  </spine>
</package>`;

  oebps?.file('content.opf', contentOpf);

  // Create toc.ncx
  const tocNcx = `<?xml version="1.0" encoding="utf-8"?>
<ncx version="2005-1" xmlns="http://www.daisy.org/z3986/2005/ncx/">
  <head>
    <meta name="dtb:uid" content="${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${book.title}</text></docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>Title Page</text></navLabel>
      <content src="titlepage.xhtml"/>
    </navPoint>
    <navPoint id="navpoint-2" playOrder="2">
      <navLabel><text>Table of Contents</text></navLabel>
      <content src="toc.xhtml"/>
    </navPoint>
${navPoints}  </navMap>
</ncx>`;

  oebps?.file('toc.ncx', tocNcx);

  // Create title page
  const titlePage = `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${book.title}</title>
</head>
<body>
  <div style="text-align: center; margin-top: 100px;">
    <h1>${book.title}</h1>
    <p><strong>Genre:</strong> ${book.genre}</p>
    <p><strong>Target Audience:</strong> ${book.targetAudience}</p>
    <div style="margin-top: 50px;">
      <p>${book.description}</p>
    </div>
  </div>
</body>
</html>`;

  oebps?.file('titlepage.xhtml', titlePage);

  // Create table of contents page
  let tocContent = '';
  book.chapters.forEach((chapter, index) => {
    tocContent += `    <li><a href="chapter${index + 1}.xhtml">Chapter ${index + 1}: ${chapter.title}</a></li>\n`;
  });

  const tocPage = `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Table of Contents</title>
</head>
<body>
  <h1>Table of Contents</h1>
  <ol>
${tocContent}  </ol>
</body>
</html>`;

  oebps?.file('toc.xhtml', tocPage);

  // Create chapter files
  book.chapters.forEach((chapter, chapterIndex) => {
    let chapterContent = `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapter.title}</title>
</head>
<body>
  <h1>Chapter ${chapterIndex + 1}: ${chapter.title}</h1>
  <p><em>${chapter.description}</em></p>
`;

    if (chapter.subChapters) {
      chapter.subChapters.forEach((subChapter, subIndex) => {
        chapterContent += `  <h2>${chapterIndex + 1}.${subIndex + 1} ${subChapter.title}</h2>\n`;
        chapterContent += `  <p><em>${subChapter.description}</em></p>\n`;
        
        if (subChapter.content) {
          // Split content into paragraphs and wrap in <p> tags
          const paragraphs = subChapter.content.split('\n').filter(p => p.trim());
          paragraphs.forEach(paragraph => {
            chapterContent += `  <p>${paragraph}</p>\n`;
          });
        }
      });
    }

    chapterContent += `</body>
</html>`;

    oebps?.file(`chapter${chapterIndex + 1}.xhtml`, chapterContent);
  });

  // Generate and save EPUB
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${book.title}.epub`);
};

export const exportAudiobook = async (book: Book, audiobook: AudiobookData): Promise<void> => {
  const zip = new JSZip();

  // Add metadata file
  const metadata = {
    title: book.title,
    author: book.author || 'AI Generated',
    genre: book.genre,
    voice: audiobook.selectedVoice,
    totalDuration: audiobook.totalDuration,
    generatedAt: audiobook.generatedAt,
    chapters: audiobook.audioChapters.map(ch => ({
      id: ch.id,
      title: ch.title,
      duration: ch.duration,
      status: ch.status
    }))
  };

  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  // Add audio files
  const audioFolder = zip.folder('audio');
  let chapterIndex = 1;

  for (const chapter of audiobook.audioChapters) {
    if (chapter.status === 'completed' && chapter.audioBlob) {
      const fileName = `${chapterIndex.toString().padStart(2, '0')}_${chapter.title.replace(/[^a-zA-Z0-9]/g, '_')}.wav`;
      audioFolder?.file(fileName, chapter.audioBlob);
      chapterIndex++;
    }
  }

  // Create playlist file (M3U format)
  let playlistContent = '#EXTM3U\n';
  playlistContent += `#EXTALBUM:${book.title}\n`;
  playlistContent += `#EXTARTIST:${book.author || 'AI Generated'}\n\n`;

  chapterIndex = 1;
  for (const chapter of audiobook.audioChapters) {
    if (chapter.status === 'completed') {
      const fileName = `${chapterIndex.toString().padStart(2, '0')}_${chapter.title.replace(/[^a-zA-Z0-9]/g, '_')}.wav`;
      const duration = Math.round(chapter.duration || 0);
      playlistContent += `#EXTINF:${duration},${chapter.title}\n`;
      playlistContent += `audio/${fileName}\n\n`;
      chapterIndex++;
    }
  }

  zip.file(`${book.title}_playlist.m3u`, playlistContent);

  // Add README file
  const readme = `# ${book.title} - Audiobook

Generated on: ${new Date(audiobook.generatedAt).toLocaleDateString()}
Voice: ${audiobook.selectedVoice}
Total Duration: ${Math.round((audiobook.totalDuration || 0) / 60)} minutes
Chapters: ${audiobook.audioChapters.filter(ch => ch.status === 'completed').length}

## Files Included:
- metadata.json: Book and audiobook information
- ${book.title}_playlist.m3u: Playlist file for media players
- audio/: Folder containing individual chapter audio files

## How to Use:
1. Extract all files to a folder
2. Open the playlist file in your preferred media player
3. Or play individual chapter files from the audio folder

Generated by Unstack AI Book Generator
`;

  zip.file('README.txt', readme);

  // Generate and save the audiobook package
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${book.title}_audiobook.zip`);
};