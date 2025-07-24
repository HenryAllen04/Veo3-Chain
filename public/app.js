/*
Purpose: Frontend JavaScript for Veo3 Story Generator with advanced editing capabilities
Handles UI interactions, API calls, progress tracking, and scene script editing
*/

class Veo3StoryGenerator {
    constructor() {
        this.currentScripts = [];
        this.currentCharacter = '';
        this.editingSceneIndex = -1;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Character selection
        document.getElementById('character').addEventListener('change', this.handleCharacterChange.bind(this));
        
        // Step 1: Generate scripts
        document.getElementById('generateScripts').addEventListener('click', this.generateScripts.bind(this));
        
        // Step 2: Navigation and confirmation
        document.getElementById('backToEdit').addEventListener('click', this.backToStep1.bind(this));
        document.getElementById('confirmGenerate').addEventListener('click', this.generateVideos.bind(this));
        
        // Step 4: Final actions
        document.getElementById('createAnother').addEventListener('click', this.reset.bind(this));
        
        // Listen for clicks on edit buttons (using event delegation)
        document.addEventListener('click', this.handleEditClick.bind(this));
    }

    handleCharacterChange(event) {
        const customInput = document.getElementById('customCharacter');
        if (event.target.value === 'custom') {
            customInput.classList.remove('hidden');
            customInput.focus();
        } else {
            customInput.classList.add('hidden');
        }
    }

    getSelectedCharacter() {
        const characterSelect = document.getElementById('character');
        const customInput = document.getElementById('customCharacter');
        
        if (characterSelect.value === 'custom') {
            return customInput.value.trim();
        } else {
            return characterSelect.value;
        }
    }

    showStep(stepNumber) {
        // Hide all steps
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`step${i}`).classList.add('hidden');
        }
        
        // Show selected step
        document.getElementById(`step${stepNumber}`).classList.remove('hidden');
    }

    async generateScripts() {
        const character = this.getSelectedCharacter();
        const prompt = document.getElementById('prompt').value.trim();
        
        // Validation
        if (!character) {
            alert('Please select or enter a character');
            return;
        }
        
        if (!prompt) {
            alert('Please enter a story prompt');
            return;
        }
        
        const promptsOnly = document.getElementById('promptsOnly').checked;

        const generateBtn = document.getElementById('generateScripts');
        const originalText = generateBtn.textContent;
        
        try {
            generateBtn.disabled = true;
            generateBtn.innerHTML = `<span class="loading mr-2"></span>${promptsOnly ? 'Generating Prompts...' : 'Generating Veo3-Optimized Scripts...'}`;
            
            const response = await fetch('/api/generate-scripts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ character, prompt, promptsOnly })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate scripts');
            }
            
            this.currentScripts = data.scripts;
            this.currentCharacter = character;
            
            // Check if prompts only mode is selected (already declared above)
            if (promptsOnly) {
                // Download prompts directly without showing step 2
                this.downloadPrompts(data.scripts);
                this.showSuccessMessage('Prompts generated and downloaded successfully!');
            } else {
                // Normal flow - show scripts for review
                this.displayScripts(data.scripts);
                this.showStep(2);
            }
            
        } catch (error) {
            console.error('Error generating scripts:', error);
            alert(`Error: ${error.message}`);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = originalText;
        }
    }

    displayScripts(scripts) {
        const container = document.getElementById('scriptsContainer');
        container.innerHTML = '';
        
        scripts.forEach((script, index) => {
            const scriptDiv = document.createElement('div');
            scriptDiv.className = 'scene-card border border-gray-300 rounded-lg p-4 relative bg-white';
            scriptDiv.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-semibold text-lg text-gray-800">Scene ${index + 1}</h3>
                    <button 
                        class="edit-button bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded-full transition-all duration-200"
                        data-scene-index="${index}"
                        title="Edit Scene ${index + 1}"
                    >
                        ✏️ Edit
                    </button>
                </div>
                <div class="mb-2">
                    <span class="veo3-tag text-xs">Veo3 Optimized</span>
                </div>
                <p class="text-gray-700 leading-relaxed scene-text" data-scene-index="${index}">${this.formatScriptText(script)}</p>
            `;
            container.appendChild(scriptDiv);
        });
    }

    formatScriptText(script) {
        // Add some basic formatting to make the script more readable
        return script.replace(/\. /g, '.<br><br>').replace(/Audio:/g, '<br><strong>Audio:</strong>');
    }

    handleEditClick(event) {
        if (event.target.classList.contains('edit-button') || event.target.closest('.edit-button')) {
            const button = event.target.classList.contains('edit-button') ? event.target : event.target.closest('.edit-button');
            const sceneIndex = parseInt(button.getAttribute('data-scene-index'));
            this.openEditModal(sceneIndex);
        }
    }

    openEditModal(sceneIndex) {
        this.editingSceneIndex = sceneIndex;
        const currentScript = this.currentScripts[sceneIndex];
        
        // Create modal HTML
        const modalHTML = `
            <div id="editModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-90vh overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-semibold text-gray-800">Edit Scene ${sceneIndex + 1}</h2>
                        <button id="closeModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                    </div>
                    
                    <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p class="text-blue-800 text-sm">
                            <strong>💡 Veo3 Optimization Tips:</strong> Include character details, camera movements (dolly, pan, tracking), 
                            shot composition (close-up, wide shot), lighting/ambiance, and audio cues for best results.
                        </p>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Scene Script (Veo3 Optimized)
                        </label>
                        <textarea id="editScriptText" rows="8" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your scene script with detailed Veo3 optimizations...">${currentScript}</textarea>
                    </div>
                    
                    <div class="flex gap-3 justify-end">
                        <button id="cancelEdit" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200">
                            Cancel
                        </button>
                        <button id="saveEdit" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200">
                            💾 Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add event listeners
        document.getElementById('closeModal').addEventListener('click', this.closeEditModal.bind(this));
        document.getElementById('cancelEdit').addEventListener('click', this.closeEditModal.bind(this));
        document.getElementById('saveEdit').addEventListener('click', this.saveEditedScript.bind(this));
        
        // Focus on textarea
        document.getElementById('editScriptText').focus();
    }

    saveEditedScript() {
        const newScriptText = document.getElementById('editScriptText').value.trim();
        
        if (!newScriptText) {
            alert('Please enter a script for this scene.');
            return;
        }
        
        // Update the script in our array
        this.currentScripts[this.editingSceneIndex] = newScriptText;
        
        // Update the display
        this.displayScripts(this.currentScripts);
        
        // Close modal
        this.closeEditModal();
        
        // Show success feedback
        this.showEditSuccessMessage();
    }

    closeEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.remove();
        }
        this.editingSceneIndex = -1;
    }

    showEditSuccessMessage() {
        // Create temporary success message
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        successMsg.textContent = '✅ Scene updated successfully!';
        document.body.appendChild(successMsg);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
    }
    
    downloadPrompts(scripts) {
        // Create a formatted text file with the prompts
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `veo3-prompts-${this.currentCharacter}-${timestamp}.txt`;
        
        let content = `Veo3 Story Prompts\n`;
        content += `Character: ${this.currentCharacter}\n`;
        content += `Generated: ${new Date().toLocaleString()}\n`;
        content += `${'='.repeat(50)}\n\n`;
        
        scripts.forEach((script, index) => {
            content += `SCENE ${index + 1} (8 seconds)\n`;
            content += `${'-'.repeat(30)}\n`;
            content += `${script}\n\n`;
        });
        
        content += `\n${'='.repeat(50)}\n`;
        content += `Note: Each scene is optimized for 8-second Veo3 video generation.\n`;
        content += `Estimated cost if generated: $${(scripts.length * 4).toFixed(2)} (3 × 8-second videos at $0.50/second)\n`;
        
        // Create blob and download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    showSuccessMessage(message) {
        // Create temporary success message
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center';
        successMsg.innerHTML = `
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            ${message}
        `;
        document.body.appendChild(successMsg);
        
        // Remove after 5 seconds
        setTimeout(() => {
            successMsg.remove();
        }, 5000);
    }

    backToStep1() {
        this.showStep(1);
    }

    async generateVideos() {
        if (!this.currentScripts || this.currentScripts.length === 0) {
            alert('No scripts available. Please generate scripts first.');
            return;
        }

        this.showStep(3);
        this.resetProgress();
        
        try {
            // Show generation is starting
            this.updateStatus('status1', 'Scene 1: Starting generation...', true);
            
            const response = await fetch('/api/generate-videos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    scripts: this.currentScripts,
                    character: this.currentCharacter
                })
            });
            
            // Note: This is a simplified version. In a real implementation,
            // you'd want to use WebSockets or Server-Sent Events for real-time progress
            this.simulateProgress();
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate videos');
            }
            
            this.completeProgress();
            
            // Show the result
            setTimeout(() => {
                this.showResult(data.videoPath);
            }, 1000);
            
        } catch (error) {
            console.error('Error generating videos:', error);
            alert(`Error: ${error.message}`);
            this.showStep(2); // Go back to step 2
        }
    }

    resetProgress() {
        // Reset progress bar
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('progressText').textContent = '0%';
        
        // Reset status indicators
        for (let i = 1; i <= 3; i++) {
            this.updateStatus(`status${i}`, `Scene ${i}: Waiting...`, false);
        }
        this.updateStatus('statusConcat', 'Video concatenation: Waiting...', false);
    }

    updateStatus(statusId, message, showLoading) {
        const statusElement = document.getElementById(statusId);
        const loadingSpinner = statusElement.querySelector('.loading');
        const textElement = statusElement.querySelector('span:last-child');
        
        textElement.textContent = message;
        
        if (showLoading) {
            loadingSpinner.classList.remove('hidden');
            statusElement.className = 'flex items-center text-blue-600';
        } else {
            loadingSpinner.classList.add('hidden');
            statusElement.className = 'flex items-center text-green-600';
        }
    }

    simulateProgress() {
        // This is a simplified progress simulation
        // In a real implementation, you'd get actual progress from the server
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress > 90) progress = 90; // Don't complete until actual completion
            
            this.updateProgressBar(progress);
            
            // Update status based on progress
            if (progress > 10 && progress < 40) {
                this.updateStatus('status1', 'Scene 1: Generating video...', true);
            } else if (progress > 40 && progress < 70) {
                this.updateStatus('status1', 'Scene 1: Complete ✓', false);
                this.updateStatus('status2', 'Scene 2: Generating video...', true);
            } else if (progress > 70 && progress < 90) {
                this.updateStatus('status2', 'Scene 2: Complete ✓', false);
                this.updateStatus('status3', 'Scene 3: Generating video...', true);
            }
            
            if (progress >= 90) {
                clearInterval(interval);
            }
        }, 1000);
    }

    completeProgress() {
        this.updateProgressBar(100);
        this.updateStatus('status1', 'Scene 1: Complete ✓', false);
        this.updateStatus('status2', 'Scene 2: Complete ✓', false);
        this.updateStatus('status3', 'Scene 3: Complete ✓', false);
        this.updateStatus('statusConcat', 'Video concatenation: Complete ✓', false);
    }

    updateProgressBar(percentage) {
        document.getElementById('progressBar').style.width = `${percentage}%`;
        document.getElementById('progressText').textContent = `${Math.round(percentage)}%`;
    }

    showResult(videoPath) {
        const video = document.getElementById('resultVideo');
        const downloadBtn = document.getElementById('downloadBtn');
        
        // Set video source
        video.src = videoPath;
        
        // Set download link
        downloadBtn.href = videoPath;
        downloadBtn.download = videoPath.split('/').pop();
        
        this.showStep(4);
    }

    reset() {
        // Reset all form data
        document.getElementById('character').value = '';
        document.getElementById('customCharacter').value = '';
        document.getElementById('customCharacter').classList.add('hidden');
        document.getElementById('prompt').value = '';
        
        // Reset internal state
        this.currentScripts = [];
        this.currentCharacter = '';
        
        // Show step 1
        this.showStep(1);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Veo3StoryGenerator();
    console.log('🎬 Veo3 Story Generator initialized');
}); 