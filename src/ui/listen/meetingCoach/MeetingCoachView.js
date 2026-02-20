import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class MeetingCoachView extends LitElement {
    static styles = css`
        :host {
            display: block;
            width: 100%;
            position: relative;
        }

        :host([hidden]) {
            display: none;
        }

        .coach-container {
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-height: 400px;
            overflow-y: auto;
        }

        .coach-container::-webkit-scrollbar {
            width: 6px;
        }

        .coach-container::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 3px;
        }

        .coach-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
        }

        .coach-answer {
            background: rgba(0, 122, 255, 0.15);
            border: 1px solid rgba(0, 122, 255, 0.3);
            border-radius: 12px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .question-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;
        }

        .question-icon {
            width: 16px;
            height: 16px;
            color: rgba(255, 255, 255, 0.7);
        }

        .question-text {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            font-style: italic;
        }

        .say-this-section {
            background: rgba(0, 122, 255, 0.2);
            border-left: 3px solid rgba(0, 122, 255, 0.8);
            padding: 10px;
            border-radius: 6px;
        }

        .say-this-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 6px;
            font-weight: 600;
        }

        .say-this-text {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.95);
            line-height: 1.5;
            font-weight: 500;
        }

        .long-answer-section {
            margin-top: 8px;
        }

        .long-answer-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 6px;
            font-weight: 600;
        }

        .long-answer-text {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.85);
            line-height: 1.6;
        }

        .code-section {
            margin-top: 10px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .code-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 6px;
            font-weight: 600;
        }

        .code-snippet {
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 11px;
            color: #50fa7b;
            background: rgba(0, 0, 0, 0.4);
            padding: 8px;
            border-radius: 4px;
            overflow-x: auto;
            white-space: pre;
            margin-bottom: 6px;
        }

        .code-explain {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.5;
            font-style: italic;
        }

        .actions {
            display: flex;
            gap: 8px;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .action-button {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 0.9);
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .action-button:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.3);
        }

        .action-button:active {
            transform: scale(0.98);
        }

        .action-button svg {
            width: 12px;
            height: 12px;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            color: rgba(255, 255, 255, 0.5);
            font-size: 12px;
            text-align: center;
        }

        .empty-state-icon {
            width: 32px;
            height: 32px;
            margin-bottom: 12px;
            opacity: 0.5;
        }

        .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.6);
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            margin-bottom: 8px;
        }

        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: rgba(0, 122, 255, 0.8);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.5;
            }
        }

        .expandable {
            cursor: pointer;
            user-select: none;
        }

        .expanded-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        }

        .expanded-content.expanded {
            max-height: 500px;
        }
    `;

    static properties = {
        answers: { type: Array },
        status: { type: String },
        isVisible: { type: Boolean },
    };

    constructor() {
        super();
        this.answers = [];
        this.status = 'Ready';
        this.isVisible = true;
        this.expandedAnswers = new Set();
    }

    connectedCallback() {
        super.connectedCallback();
        if (window.api) {
            window.api.meetingCoach.onAnswer((event, answer) => {
                this.handleAnswer(answer);
            });
            window.api.meetingCoach.onStatus((event, status) => {
                this.status = status;
                this.requestUpdate();
            });
        }
    }

    handleAnswer(answer) {
        // Add answer to the list (keep last 5)
        this.answers = [answer, ...this.answers].slice(0, 5);
        this.requestUpdate();
    }

    async handleCopy(text) {
        try {
            await navigator.clipboard.writeText(text);
            console.log('Copied to clipboard');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    toggleExpand(answerId) {
        if (this.expandedAnswers.has(answerId)) {
            this.expandedAnswers.delete(answerId);
        } else {
            this.expandedAnswers.add(answerId);
        }
        this.requestUpdate();
    }

    render() {
        if (!this.isVisible) {
            return html``;
        }

        if (this.answers.length === 0) {
            return html`
                <div class="coach-container">
                    <div class="empty-state">
                        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        <div>Meeting coach is ready</div>
                        <div style="font-size: 10px; margin-top: 4px; opacity: 0.7;">
                            Answers will appear here when questions are detected
                        </div>
                    </div>
                </div>
            `;
        }

        return html`
            <div class="coach-container">
                ${this.status !== 'Ready' ? html`
                    <div class="status-indicator">
                        <div class="status-dot"></div>
                        <span>${this.status}</span>
                    </div>
                ` : ''}
                
                ${this.answers.map((answer, index) => {
                    const answerId = `answer-${index}`;
                    const isExpanded = this.expandedAnswers.has(answerId);
                    return html`
                        <div class="coach-answer">
                            <div class="question-header">
                                <svg class="question-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
                                </svg>
                                <div class="question-text">${answer.question}</div>
                            </div>

                            <div class="say-this-section">
                                <div class="say-this-label">Say This</div>
                                <div class="say-this-text">${answer.sayThis}</div>
                            </div>

                            ${answer.longAnswer ? html`
                                <div class="long-answer-section">
                                    <div 
                                        class="long-answer-label expandable"
                                        @click=${() => this.toggleExpand(answerId)}
                                    >
                                        ${isExpanded ? '▼' : '▶'} Detailed Answer
                                    </div>
                                    <div class="expanded-content ${isExpanded ? 'expanded' : ''}">
                                        <div class="long-answer-text">${answer.longAnswer}</div>
                                    </div>
                                </div>
                            ` : ''}

                            ${answer.code ? html`
                                <div class="code-section">
                                    <div class="code-label">Code</div>
                                    <pre class="code-snippet"><code>${answer.code.snippet}</code></pre>
                                    ${answer.code.explain ? html`
                                        <div class="code-explain">${answer.code.explain}</div>
                                    ` : ''}
                                </div>
                            ` : ''}

                            <div class="actions">
                                <button 
                                    class="action-button"
                                    @click=${() => this.handleCopy(answer.sayThis)}
                                    title="Copy short answer"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                    </svg>
                                    Copy
                                </button>
                                ${answer.longAnswer ? html`
                                    <button 
                                        class="action-button"
                                        @click=${() => this.handleCopy(answer.longAnswer)}
                                        title="Copy full answer"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                                        </svg>
                                        Copy Full
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                })}
            </div>
        `;
    }
}

customElements.define('meeting-coach-view', MeetingCoachView);
