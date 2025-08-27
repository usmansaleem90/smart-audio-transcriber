import { defineStore } from 'pinia'
import { uploadClient, apiClient } from '@/api/axios'
// import axios from 'axios'

/**
 * @typedef {Object} ChatMessage
 * @property {string} id - Unique identifier for the message
 * @property {string} content - Message content
 * @property {string} role - Role of the sender ('user' or 'assistant')
 * @property {Date} timestamp - When the message was sent
 */

/**
 * @typedef {Object} ChatSession
 * @property {string} id - Unique identifier for the chat
 * @property {string} title - Chat title
 * @property {string[]} transcriptionIds - IDs of associated transcriptions
 * @property {ChatMessage[]} messages - Array of chat messages
 * @property {Date} createdAt - When the chat was created
 * @property {string} status - Current status of the chat
 */

/**
 * @typedef {Object} AudioFile
 * @property {string} id - Unique identifier for the audio file
 * @property {string} title - File name/title
 * @property {string} source - Source of the audio ('upload' or 'youtube')
 * @property {Date} createdAt - When the file was added
 * @property {string} status - Current status of the file
 * @property {Object|null} transcription - Transcription data if available
 */

/**
 * Store for managing audio files and chat functionality
 */
export const useAudioStore = defineStore('audio', {
  state: () => ({
    /** @type {AudioFile[]} */
    audioFiles: [],
    /** @type {ChatSession[]} */
    chatHistory: [
      // add dummy chat
      {
        id: '1',
        title: 'Chat 1',
        transcriptionIds: ['1', '2'],
        messages: [],
        createdAt: new Date(),
        status: 'completed'
      },
      {
        id: '2',
        title: 'Chat 2',
        transcriptionIds: ['3', '4'],
        messages: [],
        createdAt: new Date(),
        status: 'completed'
      }
    ], // Array of chat sessions
    /** @type {string|null} */
    activeChat: null // Current active chat session
  }),

  actions: {
    /**
     * Adds new audio files to the store
     * @param {File[]} audioFiles - Array of audio files to add
     * @param {string} source - Source of the files ('upload' or 'youtube')
     * @param {Object} [config={}] - Optional configuration for upload
     */
    async addAudio(audioFiles, source, config = {}) {
      console.log("Adding audio files:", audioFiles);
      audioFiles.forEach(file => {
          this.audioFiles.push({
              id: `audio-${Math.random().toString(36).substr(2, 9)}`,
              title: file.name,
              source: source, // 'upload' or 'youtube'
              createdAt: new Date(),
              status: 'ready', // ready, transcribing, completed, error
              transcription: null,
          });
      });
    },
    // async addAudio(files, source, config = {}) {
    //   try {
    //     // Simulate file upload with progress
    //     for (const file of files) {
    //       // Create FormData
    //       const formData = new FormData();
    //       formData.append('file', file);

    //       // Make API call with progress tracking
    //       await axios.post('/api/upload', formData, {
    //         ...config,
    //         headers: {
    //           'Content-Type': 'multipart/form-data'
    //         }
    //       });
    //     }
    //   } catch (error) {
    //     console.error('Upload failed:', error);
    //     throw error;
    //   }
    // },

    /**
     * Updates the status of an audio file
     * @param {string} audioId - ID of the audio file
     * @param {string} status - New status to set
     */
    updateAudioStatus(audioId, status) {
      const audio = this.audioFiles.find(a => a.id === audioId);
      if (audio) {
        audio.status = status;
      }
    },

    /**
     * Sets transcription data for an audio file
     * @param {string} audioId - ID of the audio file
     * @param {Object} transcription - Transcription data
     */
    setTranscription(audioId, transcription) {
      const audio = this.audioFiles.find(a => a.id === audioId);
      if (audio) {
        audio.transcription = transcription;
        audio.status = 'completed';
      }
    },

    /**
     * Uploads audio files to the server
     * @param {string} url - Upload endpoint URL
     * @param {File[]} files - Array of files to upload
     * @returns {Promise<Object>} Upload response
     */
    uploadAudio(url, files) {
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append(`file-${index}`, file)
      })
      return uploadClient.post(url, formData, {
        timeout: 30000,
        responseType: 'json'
      })
    },

    getAudioFiles(url) {
      return apiClient.get(url)
    },

    getAudioDetails(url) {
      return apiClient.get(url)
    },

    async transcribeAudios(audioIds, language) {
      return apiClient.post('/transcribe', {
        audioIds,
        language
      })
    },

    modifyTranscription(url, prompt) {
      return apiClient.post(url, { prompt })
    },

    deleteAudio(url) {
      return apiClient.delete(url)
    },

    // Chat related actions
    createNewChat(transcriptionIds) {
      const chatId = `chat-${Math.random().toString(36).substr(2, 9)}`
      const newChat = {
        id: chatId,
        title: `Chat ${this.chatHistory.length + 1}`,
        transcriptionIds,
        messages: [],
        createdAt: new Date()
      }
      this.chatHistory.push(newChat)
      this.activeChat = chatId
      return chatId
    },

    addMessageToChat(chatId, message) {
      const chat = this.chatHistory.find(c => c.id === chatId)
      if (chat) {
        chat.messages.push({
          id: `msg-${Math.random().toString(36).substr(2, 9)}`,
          content: message.content,
          role: message.role, // 'user' or 'assistant'
          timestamp: new Date()
        })
      }
    },

    setActiveChat(chatId) {
      this.activeChat = chatId
    },

    async sendPrompt(prompt, transcriptionIds) {
      // TODO: Implement API call
      return apiClient.post('/process-transcription', {
        prompt,
        transcriptionIds
      })
    },

    /**
     * Gets a presigned URL for file upload
     * @param {string} fileName - Name of the file
     * @param {string} fileType - MIME type of the file
     * @returns {Promise<string>} Presigned URL
     */
    async getPresignedUrl(fileName, fileType) {
      const response = await apiClient.get('/audio/presigned-url', {
        params: { fileName, fileType }
      });
      return response.data.url;
    },

    /**
     * Uploads file to S3 using presigned URL
     * @param {string} url - Presigned URL
     * @param {File} file - File to upload
     * @returns {Promise<Object>} Upload response
     */
    async uploadToS3(url, file) {
      try {
        const response = await apiClient.put(url, file, {
          headers: {
            'Content-Type': file.type,
            'Cache-Control': 'max-age=31536000',
          },
          // Don't use the base URL for this request since we have a complete URL
          baseURL: null,
          // Don't add auth headers for S3 requests
          skipAuthHeader: true,
        });
        return response;
      } catch (error) {
        console.error('S3 Error Response:', error);
        throw new Error(`Failed to upload to S3: ${error.message}`);
      }
    },

    /**
     * Saves audio metadata to backend
     * @param {Object} payload - Audio metadata
     * @returns {Promise<Object>} Saved audio data
     */
    async saveAudioMetadata(payload) {
      const response = await apiClient.post('/audio', payload);
      return response.data;
    },

    /**
     * Complete upload process for a single file
     * @param {File} file - Audio file to upload
     * @returns {Promise<Object>} Upload result
     */
    async uploadSingleFile(file) {
      try {
        console.log('Uploading file:', file);
        // Get presigned URL
        const presignedUrl = await this.getPresignedUrl(file.name, file.type);
        console.log('Presigned URL:', presignedUrl);

        // Upload to S3
        const s3Response = await this.uploadToS3(presignedUrl, file);
        console.log('S3 Response:', s3Response.url);

        // Calculate duration (assuming this helper exists in your component)
        const audioDuration = await this.getAudioDuration(file);

        // Save metadata
        const payload = {
          fileName: file.name,
          time: new Date().toISOString(),
          status: 'Uploaded',
          fileUrl: s3Response?.url?.split('?')[0],
          duration: audioDuration.toFixed(2),
          userId: JSON.parse(localStorage.getItem('user')).user.id
        };

        const savedAudio = await this.saveAudioMetadata(payload);

        // Add to local state
        this.audioFiles.push({
          id: savedAudio.id,
          title: file.name,
          source: 'upload',
          createdAt: new Date(),
          status: 'ready',
          transcription: null,
        });

        return savedAudio;
      } catch (error) {
        console.error('Upload failed:', error);
        throw error;
      }
    },

    /**
     * Helper method to get audio duration
     * @param {File} file - Audio file
     * @returns {Promise<number>} Duration in seconds
     */
    getAudioDuration(file) {
      return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.addEventListener('loadedmetadata', () => {
          resolve(audio.duration);
        });
        audio.addEventListener('error', reject);
        audio.src = URL.createObjectURL(file);
      });
    },

    /**
     * Gets available language options with their links for a YouTube video
     */
    async getLangOptionsWithLink(videoId) {
      const videoPageResponse = await fetch("https://www.youtube.com/watch?v=" + videoId);
      const videoPageHtml = await videoPageResponse.text();
      const splittedHtml = videoPageHtml.split('"captions":');

      if (splittedHtml.length < 2) return;

      const captionsJson = JSON.parse(splittedHtml[1].split(',"videoDetails')[0].replace('\n', ''));
      const captionTracks = captionsJson.playerCaptionsTracklistRenderer.captionTracks;

      return captionTracks.map(track => ({
        language: track.name.simpleText,
        link: track.baseUrl
      }));
    },

    /**
     * Gets raw transcript data from a caption track link
     */
    async getRawTranscript(link) {
      const transcriptPageResponse = await fetch(link);
      const transcriptPageXml = await transcriptPageResponse.text();

      // Use browser's built-in DOMParser instead of JSDOM
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(transcriptPageXml, "text/xml");
      const textNodes = xmlDoc.getElementsByTagName("text");

      return Array.from(textNodes).map(node => ({
        start: node.getAttribute("start"),
        duration: node.getAttribute("dur"),
        text: node.textContent
      }));
    },

    /**
     * Gets complete transcript text from a language option
     */
    async getTranscript(langOption) {
      const rawTranscript = await this.getRawTranscript(langOption.link);
      return rawTranscript.map(item => item.text).join(" ");
    },

    /**
     * Cleans and formats transcript text
     */
    cleanTranscript(text) {
      let cleaned = text
        .replace(/&#39;/g, "'")
        .replace(/\(.*?\)/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      let sentences = cleaned.split(/[.!?]+/).map(sentence => 
        sentence.trim()
      ).filter(sentence => 
        sentence && sentence.length > 10
      );

      return sentences.map(sentence => 
        sentence.charAt(0).toUpperCase() + 
        sentence.slice(1) + 
        '.'
      ).join('\n');
    },

    /**
     * Extracts transcript from YouTube video
     */
    async extractYoutubeTranscript(videoId) {
      console.log("Processing video ID:", videoId);
      
      try {
        // Get language options with links
        const langOptions = await this.getLangOptionsWithLink(videoId);
        if (!langOptions || langOptions.length === 0) {
          throw new Error("No captions available for this video.");
        }
        console.log("Available languages:", langOptions);

        // Select first language option (usually English)
        const selectedLangOption = langOptions[0];
        console.log("Selected language:", selectedLangOption);

        // Get transcript
        const transcript = await this.getTranscript(selectedLangOption);
        const cleanedTranscript = this.cleanTranscript(transcript);
        console.log("Cleaned transcript:", cleanedTranscript);

        return cleanedTranscript;
      } catch (error) {
        console.error("Error extracting transcript:", error);
        throw error;
      }
    },
  },

  getters: {
    /**
     * Gets audio files with 'ready' status
     * @returns {AudioFile[]}
     */
    getReadyAudios: (state) => {
      return state.audioFiles.filter(audio => audio.status === 'ready');
    },

    /**
     * Gets audio files with 'completed' status
     * @returns {AudioFile[]}
     */
    getCompletedAudios: (state) => {
      return state.audioFiles.filter(audio => audio.status === 'completed')
    },

    getCurrentChat: (state) => {
      return state.chatHistory.find(chat => chat.id === state.activeChat)
    },

    getChatTranscriptions: (state) => (chatId) => {
      const chat = state.chatHistory.find(c => c.id === chatId)
      if (!chat) return []
      return state.audioFiles.filter(audio => 
        chat.transcriptionIds.includes(audio.id) && 
        audio.transcription
      )
    }
  },
}) 