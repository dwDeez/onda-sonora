export interface OllamaResponse {
    model: string;
    created_at: string;
    message: {
        role: string;
        content: string;
    };
    done: boolean;
}

export class OllamaService {
    private baseUrl: string;
    private model: string;

    constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama3') {
        this.baseUrl = baseUrl;
        this.model = model;
    }

    setModel(model: string) {
        this.model = model;
    }

    async generateChatResponse(messages: { role: string; content: string }[], systemInstruction?: string): Promise<string> {
        const allMessages = systemInstruction
            ? [{ role: 'system', content: systemInstruction }, ...messages]
            : messages;

        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: allMessages,
                    stream: false,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data: OllamaResponse = await response.json();
            return data.message.content;
        } catch (error: any) {
            console.error('Failed to call Ollama:', error);
            const message = error.message || 'Unknown network error';
            throw new Error(`Ollama connection failed: ${message}. Make sure Ollama is running and accessible.`);
        }
    }

    async analyzeTranscript(text: string): Promise<any> {
        const prompt = `Analyze this spoken English sentence for any grammatical, vocabulary, or phrasing errors. If it's perfect, reply EXACTLY with "PERFECT". If there are errors, return a strict JSON object with this exact structure, nothing else: {"type": "Grammar|Vocab|Pronunciation", "description": "Short explanation", "correction": "Corrected sentence", "original": "${text}"}\n\nSentence: "${text}"`;

        try {
            const response = await this.generateChatResponse([{ role: 'user', content: prompt }]);
            const cleanedResponse = response.trim();

            if (cleanedResponse === 'PERFECT') {
                return 'PERFECT';
            }

            // Try to extract JSON if the model added extra text
            const jsonMatch = cleanedResponse.match(/\{.*\}/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            throw new Error('Could not parse Ollama response as JSON');
        } catch (error) {
            console.error('Ollama analysis failed:', error);
            throw error;
        }
    }

    async translate(text: string, direction: 'es-en' | 'en-es'): Promise<string> {
        const sourceLang = direction === 'es-en' ? 'Spanish' : 'English';
        const targetLang = direction === 'es-en' ? 'English' : 'Spanish';

        const systemPrompt = `You are a professional translator. Translate the text from ${sourceLang} to ${targetLang}. 
Return ONLY the translated text without any explanations, notes, or extra punctuation.
Maintain the original tone and context.`;

        try {
            const response = await this.generateChatResponse([{ role: 'user', content: text }], systemPrompt);
            return response.trim();
        } catch (error) {
            console.error('Translation failed:', error);
            throw error;
        }
    }
}


export const ollama = new OllamaService();
