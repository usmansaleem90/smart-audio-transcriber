import { JSDOM } from 'jsdom';

export async function getLangOptionsWithLink(videoId) {
  const videoPageResponse = await fetch("https://www.youtube.com/watch?v=" + videoId);
  const videoPageHtml = await videoPageResponse.text();
  const splittedHtml = videoPageHtml.split('"captions":');

  if (splittedHtml.length < 2) return;

  const captionsJson = JSON.parse(splittedHtml[1].split(',"videoDetails')[0].replace('\n', ''));
  const captionTracks = captionsJson.playerCaptionsTracklistRenderer.captionTracks;

  const languageOptions = captionTracks.map(track => track.name.simpleText);
  languageOptions.sort((x, y) => 
    x.includes("English") ? -1 : y.includes("English") ? 1 : 0
  );

  return captionTracks.map(track => ({
    language: track.name.simpleText,
    link: track.baseUrl
  }));
}

export async function getRawTranscript(link) {
  const transcriptPageResponse = await fetch(link);
  const transcriptPageXml = await transcriptPageResponse.text();

  const dom = new JSDOM();
  const parser = new dom.window.DOMParser();
  const xmlDoc = parser.parseFromString(transcriptPageXml, "text/xml");
  const textNodes = xmlDoc.getElementsByTagName("text");

  return Array.from(textNodes).map(node => ({
    start: node.getAttribute("start"),
    duration: node.getAttribute("dur"),
    text: node.textContent
  }));
}

export async function getTranscript(langOption) {
  const rawTranscript = await getRawTranscript(langOption.link);
  return rawTranscript.map(item => item.text).join(" ");
}

function cleanTranscript(text) {
  // Remove special characters and HTML entities
  let cleaned = text
    .replace(/&#39;/g, "'")
    .replace(/\(.*?\)/g, '') // Remove content in parentheses
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split into sentences
  let sentences = cleaned.split(/[.!?]+/).map(sentence => 
    sentence.trim()
  ).filter(sentence => 
    sentence && sentence.length > 10 // Remove very short segments
  );

  // Clean and format each sentence
  return sentences.map(sentence => 
    sentence.charAt(0).toUpperCase() + 
    sentence.slice(1) + 
    '.'
  ).join('\n');
}

 

async function main(videoId) {
  console.log("Main ----------------- ");
  const videoId = "foD42-73wdI"; // Replace with the YouTube video ID

  try {
    // Step 1: Get language options with links
    const langOptions = await getLangOptionsWithLink(videoId);
    if (!langOptions || langOptions.length === 0) {
      console.error("No captions available for this video.");
      return;
    }
    console.log("Language Options:", langOptions);

    // Step 2: Select the first language option (or let the user choose)
    const selectedLangOption = langOptions[0];
    console.log("Selected Language Option:", selectedLangOption);

    // Step 3: Fetch the raw transcript
    const rawTranscript = await getRawTranscript(selectedLangOption.link);
    console.log("Raw Transcript:", rawTranscript);

    // Step 4: Fetch and process the complete transcript as plain text
    const transcript = await getTranscript(selectedLangOption);
    // console.log("Full Transcript (Plain Text):", transcript);
    console.log('Clean Transcript --------- > ' , cleanTranscript(transcript));


  } catch (error) {
    console.error("Error:", error);
  }
}

main();