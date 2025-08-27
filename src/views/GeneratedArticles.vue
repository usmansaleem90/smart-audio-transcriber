<template>
    <v-container>
        <!-- Header Section -->
        <div class="d-flex flex-wrap align-center justify-space-between mb-6">
            <div class="mb-3 mb-sm-0">
                <h1 class="text-h5 text-sm-h4 font-weight-bold mb-1">Transcripts</h1>
                <p class="text-body-2 text-sm-body-1 text-medium-emphasis">
                 View your transcribed audio files
                </p>
            </div>

            <v-btn color="primary" prepend-icon="mdi-upload" @click="$router.push('/dashboard/upload-audio')"
                class="w-100 w-sm-auto">
                Upload New
            </v-btn>
        </div>

        <!-- Search and Filter Section -->
        <v-card class="mb-6">
            <v-card-text>
                <v-row dense>
                    <v-col cols="12" sm="4" class="pb-2">
                        <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Search files"
                            density="comfortable" variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12" sm="4" class="pb-2">
                        <v-select v-model="dateFilter" :items="dateFilters" label="Date Range" density="comfortable"
                            variant="outlined" hide-details />
                    </v-col>
                    <v-col cols="12" sm="4" class="pb-2">
                        <v-select v-model="sortBy" :items="sortOptions" label="Sort by" density="comfortable"
                            variant="outlined" hide-details />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Table Section - Add mobile responsive classes -->
        <v-card>
            <v-data-table :headers="headers" :items="filteredAudioFiles" :loading="loading" :search="search"
                class="elevation-1" density="comfortable" :mobile-breakpoint="0">
                <!-- Name Column with Status Icon -->
                <template v-slot:item.name="{ item }">
                    <div class="d-flex align-center">
                        <v-icon :color="getStatusColor(item.status)" size="small" class="me-2">
                            {{ getStatusIcon(item.status) }}
                        </v-icon>
                        {{ item.name }}
                    </div>
                </template>

                <!-- Duration Column -->
                <template v-slot:item.duration="{ item }">
                    {{ formatDuration(item.duration) }}
                </template>

                <!-- Date Column -->
                <template v-slot:item.date="{ item }">
                    <div class="d-flex flex-column">
                        <span>{{ formatDate(item.date) }}</span>
                        <span class="text-caption text-medium-emphasis">
                            {{ formatTime(item.date) }}
                        </span>
                    </div>
                </template>

                <!-- Status Column -->
                <template v-slot:item.status="{ item }">
                    <v-chip :color="getStatusColor(item.status)" size="small" class="text-capitalize">
                        {{ item.status }}
                    </v-chip>
                </template>

                <!-- Actions Column -->
                <template v-slot:item.actions="{ item }">
                    <v-btn icon="mdi-play" size="small" color="primary" variant="text" @click="playAudio(item)"
                        :disabled="!item.url || currentlyPlaying === item.id" />
                    <v-btn icon="mdi-text" size="small" color="primary" variant="text" @click="viewTranscript(item)"
                        :disabled="item.status !== 'completed'" />
                    <v-btn icon="mdi-robot" size="small" color="primary" variant="text" @click="openPromptDialog(item)"
                        :disabled="item.status !== 'completed'" />
                    <v-btn icon="mdi-download" size="small" color="primary" variant="text" @click="downloadAudio(item)"
                        :disabled="!item.url" />
                    <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="confirmDelete(item)" />
                </template>
            </v-data-table>
        </v-card>

        <!-- Audio Player Dialog -->
        <v-dialog v-model="audioDialog" max-width="500">
            <v-card>
                <v-card-title class="d-flex align-center pa-4">
                    <span class="text-truncate">{{ selectedFile?.name }}</span>
                    <v-spacer />
                    <v-btn icon="mdi-close" variant="text" @click="audioDialog = false" />
                </v-card-title>
                <v-card-text class="pa-4">
                    <audio v-if="selectedFile" controls class="w-100" :src="selectedFile.url" @ended="audioEnded" />
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- Transcript Dialog -->
        <v-dialog v-model="transcriptDialog" max-width="700">
            <v-card>
                <v-card-title class="d-flex align-center pa-4">
                    <span class="text-truncate">Transcript - {{ selectedFile?.name }}</span>
                    <v-spacer />
                    <v-btn icon="mdi-close" variant="text" @click="transcriptDialog = false" />
                </v-card-title>
                <v-card-text class="pa-4">
                    <v-sheet color="grey-lighten-4" class="pa-4 rounded-lg" v-if="selectedFile">
                        {{ selectedFile.transcript }}
                    </v-sheet>
                </v-card-text>
                <v-card-actions class="pa-4">
                    <v-spacer />
                    <v-btn prepend-icon="mdi-content-copy" variant="text" @click="copyTranscript">
                        Copy Text
                    </v-btn>
                    <v-btn color="primary" prepend-icon="mdi-download" @click="downloadTranscript">
                        Download
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="deleteDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h5 pa-4">
                    Confirm Delete
                </v-card-title>
                <v-card-text class="pa-4">
                    Are you sure you want to delete this audio file? This action cannot be undone.
                </v-card-text>
                <v-card-actions class="pa-4">
                    <v-spacer />
                    <v-btn variant="text" @click="deleteDialog = false">
                        Cancel
                    </v-btn>
                    <v-btn color="error" @click="deleteAudio" :loading="deleting">
                        Delete
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Prompt Dialog -->
        <v-dialog v-model="promptDialog" max-width="800">
            <v-card>
                <v-card-title class="d-flex align-center pa-4">
                    <span class="text-truncate">AI Prompts - {{ selectedFile?.name }}</span>
                    <v-spacer />
                    <v-btn icon="mdi-close" variant="text" @click="promptDialog = false" />
                </v-card-title>

                <v-card-text class="pa-4">
                    <!-- Chat/History Area -->
                    <v-sheet class="chat-history mb-4" color="grey-lighten-4" rounded height="400"
                        style="overflow-y: auto">
                        <div v-for="(message, index) in promptHistory" :key="index" class="pa-3 mb-2" :class="{
                            'user-message': message.type === 'prompt',
                            'ai-message': message.type === 'response'
                        }">
                            <div class="d-flex align-center mb-1">
                                <v-avatar size="24" :color="message.type === 'prompt' ? 'primary' : 'success'"
                                    class="me-2">
                                    <v-icon size="small" color="white">
                                        {{ message.type === 'prompt' ? 'mdi-account' : 'mdi-robot' }}
                                    </v-icon>
                                </v-avatar>
                                <span class="text-caption text-medium-emphasis">
                                    {{ message.type === 'prompt' ? 'You' : 'AI Assistant' }}
                                </span>
                                <span class="text-caption text-medium-emphasis ms-2">
                                    {{ formatTime(message.timestamp) }}
                                </span>
                            </div>
                            <div class="text-body-1">{{ message.content }}</div>
                        </div>
                    </v-sheet>

                    <!-- Prompt Input Area -->
                    <v-form @submit.prevent="sendPrompt">
                        <v-textarea v-model="newPrompt" label="Enter your prompt" rows="3" auto-grow hide-details
                            class="mb-2" :loading="processingPrompt" :disabled="processingPrompt" />
                        <div class="d-flex align-center">
                            <v-chip-group>
                                <v-chip v-for="(suggestion, index) in promptSuggestions" :key="index" size="small"
                                    @click="newPrompt = suggestion">
                                    {{ suggestion }}
                                </v-chip>
                            </v-chip-group>
                            <v-spacer />
                            <v-btn color="primary" :loading="processingPrompt" :disabled="!newPrompt.trim()"
                                @click="sendPrompt">
                                Send
                            </v-btn>
                        </div>
                    </v-form>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script>
/**
 * @component DashboardHome
 * @description Main dashboard view for managing and reviewing audio files and their transcriptions
 */
export default {
    name: "GenerateArticles",

    data() {
        return {
            search: '',
            loading: false,
            /** @type {boolean} Loading state for delete operation */
            deleting: false,
            /** @type {boolean} Audio player dialog visibility */
            audioDialog: false,
            /** @type {boolean} Transcript dialog visibility */
            transcriptDialog: false,
            /** @type {boolean} Delete confirmation dialog visibility */
            deleteDialog: false,
            /** @type {boolean} AI prompt dialog visibility */
            promptDialog: false,
            /** @type {Object|null} Currently selected audio file */
            selectedFile: null,
            /** @type {string} Current AI prompt input */
            newPrompt: "",
            /** @type {boolean} AI prompt processing state */
            processingPrompt: false,
            /** @type {Array<Object>} History of prompts and responses */
            promptHistory: [],
            /** @type {string|null} ID of currently playing audio */
            currentlyPlaying: null,
            selectedFile: null,
            dateFilter: 'all',
            sortBy: 'newest',

            /** @type {Array<Object>} Table column configurations */
            headers: [
                {
                    title: 'Name',
                    key: 'name',
                    align: 'start',
                    sortable: true,
                    width: '40%'
                },
                {
                    title: 'Duration',
                    key: 'duration',
                    align: 'start',
                    sortable: true
                },
                {
                    title: 'Date',
                    key: 'date',
                    align: 'start',
                    sortable: true
                },
                {
                    title: 'Status',
                    key: 'status',
                    align: 'center',
                    sortable: true,
                    width: '20%'
                },
                {
                    title: 'Actions',
                    key: 'actions',
                    align: 'end',
                    sortable: false,
                    width: '20%'
                },
            ],

            /** @type {Array<Object>} Date filter options */
            dateFilters: [
                { title: 'All Time', value: 'all' },
                { title: 'Last 7 Days', value: '7days' },
                { title: 'Last 30 Days', value: '30days' },
                { title: 'Last 90 Days', value: '90days' },
            ],

            /** @type {Array<Object>} Sort options for the table */
            sortOptions: [
                { title: 'Newest First', value: 'newest' },
                { title: 'Oldest First', value: 'oldest' },
                { title: 'Name (A-Z)', value: 'name_asc' },
                { title: 'Name (Z-A)', value: 'name_desc' },
            ],

            audioFiles: [
                {
                    id: 1,
                    name: 'Q4 Team Meeting.mp3',
                    duration: 1800, // 30 minutes
                    date: '2024-03-15T10:30:00',
                    status: 'completed',
                    url: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav', // Example public audio file
                    transcript: `Team Meeting - Q4 Planning
          
                    Key Discussion Points:
                    1. Revenue projections exceeded Q3 targets by 15%
                    2. New product launch scheduled for March 2024
                    3. Team restructuring planned for next quarter

                    Action Items:
                    - Marketing team to prepare launch campaign
                    - HR to finalize hiring plans
                    - Finance to update Q1 2024 forecasts

                    Next Steps:
                    Schedule follow-up meetings with individual departments to detail implementation plans.`
                },
                {
                    id: 2,
                    name: 'Client Presentation - Project Alpha.mp3',
                    duration: 2400, // 40 minutes
                    date: '2024-03-14T14:15:00',
                    status: 'completed',
                    url: 'https://www2.cs.uic.edu/~i101/SoundFiles/ImperialMarch60.wav',
                    transcript: `Client Presentation for Project Alpha
          
                    Project Overview:
                    - Timeline: 6 months
                    - Budget: $500,000
                    - Team size: 8 members

                    Client Requirements:
                    1. Mobile-first approach
                    2. Integration with existing systems
                    3. Real-time analytics dashboard

                    Questions and Concerns:
                    - Security compliance requirements
                    - Data migration strategy
                    - Support and maintenance plans`
                },
                {
                    id: 3,
                    name: 'Product Strategy 2024.mp3',
                    duration: 3600, // 60 minutes
                    date: '2024-03-13T09:00:00',
                    status: 'processing',
                    url: null,
                    transcript: 'Processing transcription...'
                },
                {
                    id: 4,
                    name: 'Customer Feedback Session.mp3',
                    duration: 1200, // 20 minutes
                    date: '2024-03-12T16:45:00',
                    status: 'error',
                    url: null,
                    transcript: 'Error during transcription. Please try again.'
                },
                {
                    id: 5,
                    name: 'Weekly Stand-up.mp3',
                    duration: 900, // 15 minutes
                    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                    status: 'completed',
                    url: 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand60.wav',
                    transcript: `Weekly Team Stand-up

                Updates by Team:
                Frontend:
                - Completed user dashboard redesign
                - Working on performance optimizations
                - Next: Starting work on new features

                Backend:
                - API documentation updated
                - Database optimization complete
                - Next: Implementing new security features

                DevOps:
                - Successfully deployed v2.1.0
                - Monitoring systems upgraded
                - Next: Planning cloud migration

                Blockers:
                - None reported

                Action Items:
                - Review pull requests by EOD
                - Schedule security audit
                - Update sprint board`
                }
            ],
            promptDialog: false,
            newPrompt: '',
            processingPrompt: false,
            promptHistory: [],
            promptSuggestions: [
                'Summarize this transcript',
                'Extract action items',
                'List all participants',
                'Generate meeting minutes',
                'Identify key decisions',
                'Translate to Spanish'
            ]
        }
    },

    computed: {
        /**
         * Filters and sorts audio files based on current search, date, and sort settings
         * @returns {Array<Object>} Filtered and sorted list of audio files
         */
        filteredAudioFiles() {
            let files = [...this.audioFiles]

            // Apply date filter
            if (this.dateFilter !== 'all') {
                const now = new Date()
                const days = parseInt(this.dateFilter)
                files = files.filter(file => {
                    const fileDate = new Date(file.date)
                    const diffTime = Math.abs(now - fileDate)
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    return diffDays <= days
                })
            }

            // Apply sorting
            switch (this.sortBy) {
                case 'newest':
                    files.sort((a, b) => new Date(b.date) - new Date(a.date))
                    break
                case 'oldest':
                    files.sort((a, b) => new Date(a.date) - new Date(b.date))
                    break
                case 'name_asc':
                    files.sort((a, b) => a.name.localeCompare(b.name))
                    break
                case 'name_desc':
                    files.sort((a, b) => b.name.localeCompare(a.name))
                    break
            }

            return files
        }
    },

    methods: {
        /**
         * Gets the appropriate color for a file status
         * @param {string} status - The status of the file
         * @returns {string} Color name for the status
         */
        getStatusColor(status) {
            switch (status) {
                case 'completed':
                    return 'success'
                case 'processing':
                    return 'warning'
                case 'error':
                    return 'error'
                default:
                    return 'grey'
            }
        },

        /**
         * Gets the appropriate icon for a file status
         * @param {string} status - The status of the file
         * @returns {string} Icon name for the status
         */
        getStatusIcon(status) {
            switch (status) {
                case 'completed':
                    return 'mdi-check-circle'
                case 'processing':
                    return 'mdi-progress-clock'
                case 'error':
                    return 'mdi-alert-circle'
                default:
                    return 'mdi-help-circle'
            }
        },

        /**
         * Formats duration from seconds to MM:SS format
         * @param {number} seconds - Duration in seconds
         * @returns {string} Formatted duration string
         */
        formatDuration(seconds) {
            if (!seconds) return 'N/A'
            const minutes = Math.floor(seconds / 60)
            const remainingSeconds = seconds % 60
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
        },

        /**
         * Formats date to localized string
         * @param {Date|string} date - Date to format
         * @returns {string} Formatted date string
         */
        formatDate(date) {
            if (!date) return 'N/A'
            return new Date(date).toLocaleDateString()
        },

        /**
         * Formats time to localized string
         * @param {Date|string} date - Date to format
         * @returns {string} Formatted time string
         */
        formatTime(date) {
            if (!date) return 'N/A'
            return new Date(date).toLocaleTimeString()
        },

        /**
         * Initiates audio playback for a file
         * @param {Object} file - Audio file to play
         */
        playAudio(file) {
            if (!file?.url) return
            this.selectedFile = file
            this.currentlyPlaying = file.id
            this.audioDialog = true
        },

        /**
         * Handles audio playback completion
         */
        audioEnded() {
            this.currentlyPlaying = null
        },

        /**
         * Opens transcript viewer for a file
         * @param {Object} file - File whose transcript to view
         */
        viewTranscript(file) {
            if (!file?.transcript || file.status !== 'completed') return
            this.selectedFile = file
            this.transcriptDialog = true
        },

        /**
         * Copies transcript text to clipboard
         * @returns {Promise<void>}
         */
        async copyTranscript() {
            if (this.selectedFile?.transcript) {
                try {
                    await navigator.clipboard.writeText(this.selectedFile.transcript)
                    // TODO: Show success notification
                } catch (error) {
                    console.error('Failed to copy transcript:', error)
                    // TODO: Show error notification
                }
            }
        },

        /**
         * Downloads transcript as a text file
         */
        downloadTranscript() {
            if (!this.selectedFile?.transcript) return

            const blob = new Blob([this.selectedFile.transcript], { type: 'text/plain' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${this.selectedFile.name.replace(/\.[^/.]+$/, '')}_transcript.txt`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        },

        /**
         * Opens audio file URL in new tab
         * @param {Object} file - Audio file object
         */
        downloadAudio(file) {
            if (!file?.url) return
            window.open(file.url, '_blank')
        },

        /**
         * Opens delete confirmation dialog
         * @param {Object} file - Audio file object
         */
        confirmDelete(file) {
            if (!file) return
            this.selectedFile = file
            this.deleteDialog = true
        },

        /**
         * Deletes the selected audio file
         * @returns {Promise<void>}
         */
        async deleteAudio() {
            if (!this.selectedFile) return

            try {
                this.deleting = true
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000))
                this.audioFiles = this.audioFiles.filter(f => f.id !== this.selectedFile.id)
                this.deleteDialog = false
                // TODO: Show success notification
            } catch (error) {
                console.error('Failed to delete file:', error)
                // TODO: Show error notification
            } finally {
                this.deleting = false
            }
        },

        /**
         * Opens AI prompt dialog for a file
         * @param {Object} file - File to process with AI
         */
        openPromptDialog(file) {
            this.selectedFile = file
            this.promptDialog = true
            // Simulate loading prompt history for this file
            this.loadPromptHistory(file.id)
        },

        /**
         * Loads prompt history for a specific file
         * @param {string} fileId - ID of the file to load history for
         */
        async loadPromptHistory(fileId) {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500))

            // Different history for different files
            const mockHistories = {
                1: [
                    {
                        type: 'prompt',
                        content: 'Summarize the key points of this meeting',
                        timestamp: new Date(Date.now() - 3600000)
                    },
                    {
                        type: 'response',
                        content: `Summary of key points:
                        1. Q4 revenue exceeded targets by 15%
                        2. New product launch planned for March 2024
                        3. Team restructuring in progress
                        4. Marketing campaign needs preparation
                        5. HR has pending hiring plans`,
                        timestamp: new Date(Date.now() - 3590000)
                    },
                    {
                        type: 'prompt',
                        content: 'Extract all action items',
                        timestamp: new Date(Date.now() - 3000000)
                    },
                    {
                        type: 'response',
                        content: `Action Items:
                        • Marketing team: Prepare launch campaign
                        • HR: Finalize hiring plans
                        • Finance: Update Q1 2024 forecasts
                        • Schedule department follow-ups`,
                        timestamp: new Date(Date.now() - 2990000)
                    }
                ],
                2: [
                    {
                        type: 'prompt',
                        content: 'What is the project budget and timeline?',
                        timestamp: new Date(Date.now() - 7200000)
                    },
                    {
                        type: 'response',
                        content: 'Project Alpha has a budget of $500,000 and a timeline of 6 months with an 8-member team.',
                        timestamp: new Date(Date.now() - 7190000)
                    }
                ],
                5: [
                    {
                        type: 'prompt',
                        content: 'List all team updates',
                        timestamp: new Date(Date.now() - 1800000)
                    },
                    {
                        type: 'response',
                        content: `Team Updates:

                        Frontend Team:
                        • Completed dashboard redesign
                        • Working on performance
                        • Planning new features

                        Backend Team:
                        • Updated API docs
                        • Completed DB optimization
                        • Planning security updates

                        DevOps Team:
                        • Deployed v2.1.0
                        • Upgraded monitoring
                        • Planning cloud migration`,
                        timestamp: new Date(Date.now() - 1790000)
                    }
                ]
            }

            this.promptHistory = mockHistories[fileId] || []
        },

        /**
         * Processes and sends a new AI prompt
         * @returns {Promise<void>}
         */
        async sendPrompt() {
            if (!this.newPrompt.trim()) return

            // Add user prompt to history
            this.promptHistory.push({
                type: 'prompt',
                content: this.newPrompt,
                timestamp: new Date()
            })

            this.processingPrompt = true

            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 2000))

                // Simulate AI response
                const response = {
                    type: 'response',
                    content: `Here's a simulated response to: "${this.newPrompt}"\n\nThis would be the AI-generated content based on your prompt and the transcript.`,
                    timestamp: new Date()
                }

                this.promptHistory.push(response)
                this.newPrompt = '' // Clear input
            } catch (error) {
                console.error('Failed to process prompt:', error)
                // TODO: Show error notification
            } finally {
                this.processingPrompt = false
            }
        }
    }
}
</script>

<style scoped>
:deep(.v-data-table) {
    border-radius: 8px;
}

:deep(.v-data-table-header) {
    background-color: var(--v-background-base) !important;
}

audio {
    width: 100%;
    border-radius: 8px;
}

.chat-history {
    border: 1px solid #e0e0e0;
}

.user-message {
    background: #E3F2FD;
    border-radius: 8px;
    margin-left: 16px;
    margin-right: 48px;
}

.ai-message {
    background: white;
    border-radius: 8px;
    margin-right: 16px;
    margin-left: 48px;
}

/* Add to your existing styles */
:deep(.v-textarea textarea) {
    border-radius: 8px;
}

/* Add responsive styles */
@media (max-width: 600px) {
    :deep(.v-data-table) {
        font-size: 14px;
    }

    :deep(.v-data-table .v-table__wrapper) {
        overflow-x: auto;
    }

    .user-message {
        margin-left: 8px;
        margin-right: 24px;
    }

    .ai-message {
        margin-right: 8px;
        margin-left: 24px;
    }
}

/* Add responsive table styles */
@media (max-width: 600px) {
    :deep(.v-data-table) {
        /* Reduce overall table font size on mobile */
        font-size: 14px;
    }

    /* Hide table header cells for hidden columns */
    :deep(.v-data-table th[data-hidden="true"]),
    :deep(.v-data-table td[data-hidden="true"]) {
        display: none;
    }

    /* Adjust padding for visible cells */
    :deep(.v-data-table td) {
        padding: 8px !important;
    }

    /* Make the name column take more space on mobile */
    :deep(.v-data-table td:first-child) {
        max-width: 40%;
    }

    /* Compact action buttons */
    :deep(.v-data-table .v-btn) {
        margin: 0 2px;
        padding: 0 4px;
    }
}
</style>