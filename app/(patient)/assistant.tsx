import React, { useState, useContext } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AuthContext } from '@/contexts/AuthContext';
import { TriangleAlert as AlertTriangle, Send, Bot, User, Mic, MicOff, MessageCircle, Heart } from 'lucide-react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
/* Removed import of react-native-markdown-display due to module resolution error */
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

interface Prescription {
  id: string;
  doctorName: string;
  medicines: string[];
  instructions: string;
  date: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: 'Hello! I\'m your health assistant. How can I help you today?',
    sender: 'assistant',
    timestamp: new Date().toISOString(),
  },
];

const quickQuestions = [
  'When should I take my medicine?',
  'What are the side effects?',
  'How to check blood pressure?',
  'Emergency symptoms to watch for',
];
const router = useRouter();
const handleSOSPress = () => {
  router.push('/sos');
};

export default function AssistantScreen() {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showPrescriptions, setShowPrescriptions] = useState(false);

  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI('AIzaSyB6g9OleRTdwB-vLXiFhvD7ESGarPBvqkQ'); // Replace with your actual Google Gemini API key
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const fetchPrescriptions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          users!prescriptions_doctor_id_fkey(name)
        `)
        .eq('patient_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching prescriptions:', error);
      } else if (data) {
        const mappedPrescriptions: Prescription[] = data.map((pres: any) => ({
          id: pres.id,
          doctorName: pres.users?.name || 'Unknown Doctor',
          medicines: Array.isArray(pres.medicines) ? pres.medicines : [],
          instructions: pres.instructions || '',
          date: pres.created_at,
        }));
        setPrescriptions(mappedPrescriptions);
      }
    } catch (error) {
      console.error('Unexpected error fetching prescriptions:', error);
    }
  };

  React.useEffect(() => {
    fetchPrescriptions();
  }, [user]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // Create context from previous messages for better conversation flow
      const conversationHistory = messages.slice(-10).map(msg =>
        `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
      ).join('\n');

      const prompt = `You are a friendly and knowledgeable health assistant for patients. Provide clear, concise, and helpful information about health topics. Always include a disclaimer to consult healthcare professionals for medical advice.

Format your responses using markdown for better readability:
- Use bold for important terms or headings (do not include markdown symbols like **)
- Use bullet points (-) for lists without markdown symbols
- Use numbered lists (1., 2., etc.) without markdown symbols
- Keep paragraphs short and to the point
- Use emojis sparingly for friendliness (e.g., 💊 for medicine)
- Structure responses with clear sections if needed
- End with a clear disclaimer

Format the output for display on a phone screen, keeping content concise, easy to read, and mobile-friendly.

Keep responses engaging, empathetic, and easy to read. Avoid long paragraphs.

Previous conversation:
${conversationHistory}

User: ${currentInput}

Assistant:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble connecting right now. Please try again later or contact your healthcare provider for immediate assistance.',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real app, this would start/stop voice recording
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Bot color="#1e58ccff" size={28} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Sahayata</Text>
            <Text style={styles.headerSubtitle}>Ask me anything about your health</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
          <AlertTriangle color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Quick Questions */}
        <View style={styles.quickQuestionsSection}>
          <Text style={styles.quickQuestionsTitle}>Quick Questions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickQuestionsScroll}>
            {quickQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestionButton}
                onPress={() => handleQuickQuestion(question)}>
                <Text style={styles.quickQuestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Current Prescriptions */}
        {prescriptions.length > 0 && (
          <View style={styles.prescriptionsSection}>
            <TouchableOpacity
              style={styles.prescriptionsHeader}
              onPress={() => setShowPrescriptions(!showPrescriptions)}>
              <MessageCircle color="#1e58ccff" size={20} />
              <Text style={styles.prescriptionsTitle}>Current Prescriptions</Text>
              <Text style={styles.prescriptionsCount}>({prescriptions.length})</Text>
            </TouchableOpacity>

            {showPrescriptions && (
              <ScrollView style={styles.prescriptionsList}>
                {prescriptions.map((prescription) => (
                  <View key={prescription.id} style={styles.prescriptionCard}>
                    <Text style={styles.prescriptionDoctor}>{prescription.doctorName}</Text>
                    <Text style={styles.prescriptionMedicines}>
                      {prescription.medicines.join(', ')}
                    </Text>
                    <Text style={styles.prescriptionInstructions}>{prescription.instructions}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Messages */}
        <ScrollView style={styles.messagesContainer}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender === 'user' ? styles.userMessage : styles.assistantMessage
              ]}>
              {message.sender === 'assistant' && (
                <View style={styles.assistantAvatar}>
                  <Heart color="#1e58ccff" size={20} />
                </View>
              )}

              <View style={[
                styles.messageBubble,
                message.sender === 'user' ? styles.userBubble : styles.assistantBubble
              ]}>
                {message.sender === 'assistant' ? (
                  <MarkdownRenderer markdownText={message.text} />
                ) : (
                  <Text style={[
                    styles.messageText,
                    message.sender === 'user' ? styles.userMessageText : styles.assistantMessageText
                  ]}>
                    {message.text}
                  </Text>
                )}
                <Text style={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>

              {message.sender === 'user' && (
                <View style={styles.userAvatar}>
                  <User color="#2563EB" size={20} />
                </View>
              )}
            </View>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <View style={[styles.messageContainer, styles.assistantMessage]}>
              <View style={styles.assistantAvatar}>
                <Heart color="#10B981" size={20} />
              </View>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <Text style={styles.assistantMessageText}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your health question..."
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <TouchableOpacity
              style={styles.recordButton}
              onPress={toggleRecording}>
              {isRecording ? (
                <MicOff color="#EF4444" size={24} />
              ) : (
                <Mic color="#6B7280" size={24} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={!inputText.trim()}>
              <Send
                color={inputText.trim() ? "#ffffffff" : "#ffffffff"}
                size={20}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Simple markdown renderer component for basic markdown support
const MarkdownRenderer = ({ markdownText }: { markdownText: string }) => {
  // Basic parsing for bold, bullet points, numbered lists, and line breaks
  const lines = markdownText.split('\n');

  return (
    <View>
      {lines.map((line, index) => {
        // Bold text: **text**
        const boldRegex = /\*\*(.+?)\*\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push({ text: line.substring(lastIndex, match.index), bold: false });
          }
          // Remove ** ** from bold text for display
          parts.push({ text: match[1], bold: true });
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < line.length) {
          parts.push({ text: line.substring(lastIndex), bold: false });
        }

        // Bullet points: lines starting with '- '
        if (line.startsWith('- ')) {
          return (
            <View key={index} style={markdownStyles.bulletPoint}>
              <Text style={markdownStyles.bulletSymbol}>{'\u2022'}</Text>
              <Text style={markdownStyles.bulletText}>
                {parts.map((part, i) => (
                  <Text key={i} style={part.bold ? markdownStyles.boldText : undefined}>
                    {part.text}
                  </Text>
                ))}
              </Text>
            </View>
          );
        }

        // Numbered lists: lines starting with '1. ', '2. ', etc.
        const numberedListMatch = line.match(/^(\d+)\.\s+(.*)/);
        if (numberedListMatch) {
          return (
            <View key={index} style={markdownStyles.bulletPoint}>
              <Text style={markdownStyles.bulletSymbol}>{numberedListMatch[1]}.</Text>
              <Text style={markdownStyles.bulletText}>
                {numberedListMatch[2]}
              </Text>
            </View>
          );
        }

        // Normal paragraph line
        return (
          <Text key={index} style={markdownStyles.paragraph}>
            {parts.map((part, i) => (
              <Text key={i} style={part.bold ? markdownStyles.boldText : undefined}>
                {part.text}
              </Text>
            ))}
          </Text>
        );
      })}
    </View>
  );
};

const markdownStyles = StyleSheet.create({
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletSymbol: {
    marginRight: 6,
    fontSize: 16,
    color: '#374151',
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#111827',
  },
  paragraph: {
    marginBottom: 8,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  sosButton: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  quickQuestionsSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },
  quickQuestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  quickQuestionsScroll: {
    paddingLeft: 24,
  },
  quickQuestionButton: {
    backgroundColor: '#ced8f7ff',
    borderWidth: 1,
    borderColor: '#bcd3ffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
  },
  quickQuestionText: {
    color: '#1e58ccff',
    fontSize: 14,
    fontWeight: '500',
  },
  prescriptionsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  prescriptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prescriptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  prescriptionsCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  prescriptionsList: {
    maxHeight: 200,
  },
  prescriptionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  prescriptionDoctor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  prescriptionMedicines: {
    fontSize: 13,
    color: '#059669',
    marginBottom: 4,
  },
  prescriptionInstructions: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 4,
  },
  userAvatar: {
    backgroundColor: '#EBF8FF',
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#2563EB',
  },
  assistantBubble: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#374151',
  },
  messageTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  inputSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    paddingVertical: 8,
    maxHeight: 80,
  },
  recordButton: {
    padding: 8,
    marginLeft: 8,
  },
  sendButton: {
    backgroundColor: '#2366ccff',
    padding: 12,
    borderRadius: 20,
    marginLeft: 8,
  },
});