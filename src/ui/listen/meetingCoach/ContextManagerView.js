import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class ContextManagerView extends LitElement {
    static styles = css`
        :host {
            display: block;
            width: 100%;
            padding: 12px;
        }

        :host([hidden]) {
            display: none;
        }

        .context-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .title {
            font-size: 14px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.9);
        }

        .add-button {
            background: rgba(0, 122, 255, 0.8);
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 11px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .add-button:hover {
            background: rgba(0, 122, 255, 1);
        }

        .context-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 300px;
            overflow-y: auto;
        }

        .context-list::-webkit-scrollbar {
            width: 6px;
        }

        .context-list::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
        }

        .context-list::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
        }

        .context-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .context-item.active {
            border-color: rgba(0, 122, 255, 0.6);
            background: rgba(0, 122, 255, 0.1);
        }

        .context-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .context-item-title {
            font-size: 12px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.9);
        }

        .context-item-actions {
            display: flex;
            gap: 4px;
        }

        .action-btn {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 0.7);
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .action-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
        }

        .action-btn.danger:hover {
            background: rgba(255, 59, 48, 0.2);
            border-color: rgba(255, 59, 48, 0.4);
        }

        .context-item-preview {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.6);
            line-height: 1.4;
            max-height: 40px;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .active-badge {
            display: inline-block;
            background: rgba(0, 122, 255, 0.8);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 600;
            margin-left: 6px;
        }

        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }

        .modal {
            background: rgba(20, 20, 20, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 20px;
            width: 500px;
            max-width: 90vw;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .modal-title {
            font-size: 16px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.9);
        }

        .close-button {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .close-button:hover {
            color: rgba(255, 255, 255, 0.9);
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .form-label {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.7);
            font-weight: 500;
        }

        .form-input {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 8px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 12px;
            font-family: inherit;
        }

        .form-textarea {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 8px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 12px;
            font-family: inherit;
            min-height: 120px;
            resize: vertical;
        }

        .file-upload-area {
            border: 2px dashed rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            padding: 16px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
        }

        .file-upload-area:hover {
            border-color: rgba(0, 122, 255, 0.6);
            background: rgba(0, 122, 255, 0.05);
        }

        .file-upload-area.dragover {
            border-color: rgba(0, 122, 255, 0.8);
            background: rgba(0, 122, 255, 0.1);
        }

        .file-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-top: 8px;
        }

        .file-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(0, 0, 0, 0.2);
            padding: 6px 8px;
            border-radius: 4px;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.7);
        }

        .file-remove {
            background: transparent;
            border: none;
            color: rgba(255, 59, 48, 0.8);
            cursor: pointer;
            padding: 2px 4px;
        }

        .modal-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            margin-top: 8px;
        }

        .modal-button {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
        }

        .modal-button.primary {
            background: rgba(0, 122, 255, 0.8);
            color: white;
        }

        .modal-button.primary:hover {
            background: rgba(0, 122, 255, 1);
        }

        .modal-button.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
        }

        .modal-button.secondary:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: rgba(255, 255, 255, 0.5);
            font-size: 12px;
        }
    `;

    static properties = {
        contexts: { type: Array },
        activeContextId: { type: String },
        showModal: { type: Boolean },
        editingContext: { type: Object },
        isLoading: { type: Boolean },
        isVisible: { type: Boolean }
    };

    constructor() {
        super();
        this.contexts = [];
        this.activeContextId = null;
        this.showModal = false;
        this.editingContext = null;
        this.isLoading = false;
        this.isVisible = true;
        this.formData = {
            title: '',
            contextText: '',
            files: []
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadContexts();
    }

    async loadContexts() {
        this.isLoading = true;
        try {
            if (window.api && window.api.meetingCoach) {
                const result = await window.api.meetingCoach.getAllContexts();
                if (result.success) {
                    this.contexts = result.contexts || [];
                    this.activeContextId = result.activeContextId || null;
                }
            }
        } catch (error) {
            console.error('[ContextManager] Error loading contexts:', error);
        } finally {
            this.isLoading = false;
            this.requestUpdate();
        }
    }

    openAddModal() {
        this.editingContext = null;
        this.formData = { title: '', contextText: '', files: [] };
        this.showModal = true;
        this.requestUpdate();
    }

    openEditModal(context) {
        this.editingContext = context;
        this.formData = {
            title: context.title || '',
            contextText: context.context_text || '',
            files: context.file_paths || []
        };
        this.showModal = true;
        this.requestUpdate();
    }

    closeModal() {
        this.showModal = false;
        this.editingContext = null;
        this.formData = { title: '', contextText: '', files: [] };
        this.requestUpdate();
    }

    async handleSave() {
        if (!this.formData.title.trim()) {
            alert('Please enter a title for the context');
            return;
        }

        try {
            if (this.editingContext) {
                // Update existing
                const result = await window.api.meetingCoach.updateContext(
                    this.editingContext.id,
                    {
                        title: this.formData.title,
                        contextText: this.formData.contextText,
                        filePaths: this.formData.files
                    }
                );
                if (result.success) {
                    await this.loadContexts();
                    this.closeModal();
                }
            } else {
                // Create new
                const result = await window.api.meetingCoach.createContext({
                    title: this.formData.title,
                    contextText: this.formData.contextText,
                    filePaths: this.formData.files
                });
                if (result.success) {
                    await this.loadContexts();
                    this.closeModal();
                }
            }
        } catch (error) {
            console.error('[ContextManager] Error saving context:', error);
            alert('Failed to save context: ' + error.message);
        }
    }

    async handleSetActive(contextId) {
        try {
            const result = await window.api.meetingCoach.setActiveContext(contextId);
            if (result.success) {
                this.activeContextId = contextId;
                await this.loadContexts();
            }
        } catch (error) {
            console.error('[ContextManager] Error setting active context:', error);
        }
    }

    async handleDelete(contextId) {
        if (!confirm('Are you sure you want to delete this context?')) {
            return;
        }

        try {
            const result = await window.api.meetingCoach.deleteContext(contextId);
            if (result.success) {
                await this.loadContexts();
            }
        } catch (error) {
            console.error('[ContextManager] Error deleting context:', error);
        }
    }

    async handleFileSelect(event) {
        const files = Array.from(event.target.files);
        // In Electron, files have a path property
        const filePaths = files.map(f => f.path || f.name);
        this.formData.files = [...this.formData.files, ...filePaths];
        this.requestUpdate();
    }

    async handleFileDialog() {
        try {
            if (window.api && window.api.meetingCoach && window.api.meetingCoach.selectFiles) {
                const result = await window.api.meetingCoach.selectFiles();
                if (result.success && result.filePaths) {
                    this.formData.files = [...this.formData.files, ...result.filePaths];
                    this.requestUpdate();
                }
            } else {
                // Fallback: trigger file input
                this.shadowRoot.getElementById('file-input').click();
            }
        } catch (error) {
            console.error('[ContextManager] Error selecting files:', error);
            // Fallback: trigger file input
            this.shadowRoot.getElementById('file-input').click();
        }
    }

    handleFileRemove(index) {
        this.formData.files.splice(index, 1);
        this.requestUpdate();
    }

    render() {
        if (!this.isVisible) {
            return html``;
        }

        return html`
            <div class="context-container">
                <div class="header">
                    <div class="title">Meeting Context</div>
                    <button class="add-button" @click=${this.openAddModal}>+ Add Context</button>
                </div>

                ${this.isLoading ? html`
                    <div class="empty-state">Loading contexts...</div>
                ` : this.contexts.length === 0 ? html`
                    <div class="empty-state">
                        No contexts yet. Add one to provide background information for your meetings.
                    </div>
                ` : html`
                    <div class="context-list">
                        ${this.contexts.map(context => html`
                            <div class="context-item ${context.id === this.activeContextId ? 'active' : ''}">
                                <div class="context-item-header">
                                    <div>
                                        <span class="context-item-title">${context.title}</span>
                                        ${context.id === this.activeContextId ? html`
                                            <span class="active-badge">ACTIVE</span>
                                        ` : ''}
                                    </div>
                                    <div class="context-item-actions">
                                        ${context.id !== this.activeContextId ? html`
                                            <button class="action-btn" @click=${() => this.handleSetActive(context.id)}>
                                                Activate
                                            </button>
                                        ` : html`
                                            <button class="action-btn" @click=${() => this.handleSetActive(null)}>
                                                Deactivate
                                            </button>
                                        `}
                                        <button class="action-btn" @click=${() => this.openEditModal(context)}>
                                            Edit
                                        </button>
                                        <button class="action-btn danger" @click=${() => this.handleDelete(context.id)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                <div class="context-item-preview">
                                    ${(context.context_text || '').substring(0, 100)}${context.context_text && context.context_text.length > 100 ? '...' : ''}
                                </div>
                            </div>
                        `)}
                    </div>
                `}

                ${this.showModal ? html`
                    <div class="modal-overlay" @click=${(e) => e.target === e.currentTarget && this.closeModal()}>
                        <div class="modal">
                            <div class="modal-header">
                                <div class="modal-title">${this.editingContext ? 'Edit Context' : 'Add Meeting Context'}</div>
                                <button class="close-button" @click=${this.closeModal}>&times;</button>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Title</label>
                                <input 
                                    class="form-input" 
                                    type="text" 
                                    .value=${this.formData.title}
                                    @input=${(e) => this.formData.title = e.target.value}
                                    placeholder="e.g., Q4 Planning Meeting"
                                />
                            </div>

                            <div class="form-group">
                                <label class="form-label">Context (paste meeting agenda, notes, or background info)</label>
                                <textarea 
                                    class="form-textarea"
                                    .value=${this.formData.contextText}
                                    @input=${(e) => this.formData.contextText = e.target.value}
                                    placeholder="Paste meeting agenda, key points, participant info, or any relevant context here..."
                                ></textarea>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Attach Files (optional)</label>
                                <div 
                                    class="file-upload-area"
                                    @dragover=${(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                                    @dragleave=${(e) => e.currentTarget.classList.remove('dragover')}
                                    @drop=${async (e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('dragover');
                                        const files = Array.from(e.dataTransfer.files);
                                        // In Electron, get file paths from the File objects
                                        const filePaths = files.map(f => {
                                            // Try to get path from file object (Electron adds this)
                                            return f.path || f.name;
                                        });
                                        this.formData.files = [...this.formData.files, ...filePaths];
                                        this.requestUpdate();
                                    }}
                                >
                                    <input 
                                        type="file" 
                                        multiple 
                                        style="display: none" 
                                        id="file-input"
                                        @change=${this.handleFileSelect}
                                    />
                                    <div @click=${this.handleFileDialog}>
                                        Click to upload or drag files here
                                    </div>
                                </div>
                                ${this.formData.files.length > 0 ? html`
                                    <div class="file-list">
                                        ${this.formData.files.map((file, index) => html`
                                            <div class="file-item">
                                                <span>${file}</span>
                                                <button class="file-remove" @click=${() => this.handleFileRemove(index)}>×</button>
                                            </div>
                                        `)}
                                    </div>
                                ` : ''}
                            </div>

                            <div class="modal-actions">
                                <button class="modal-button secondary" @click=${this.closeModal}>Cancel</button>
                                <button class="modal-button primary" @click=${this.handleSave}>Save</button>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('context-manager-view', ContextManagerView);
