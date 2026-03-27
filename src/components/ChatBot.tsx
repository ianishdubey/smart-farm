import { useState, useEffect } from 'react';
import { X, Send, Bot, Sprout, Cloud, TrendingUp, DollarSign, Bug, MessageSquare, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'features' | 'actions';
  actions?: Array<{ label: string; action: string }>;
}

interface Props {
  onClose: () => void;
}

const FEATURED_FEATURES = [
  {
    icon: Sprout,
    title: 'Crop Recommendation',
    description: 'Get AI-powered crop suggestions based on your soil and weather',
    action: 'crops',
  },
  {
    icon: Cloud,
    title: 'Weather Forecast',
    description: '7-day weather forecasts to plan your farming activities',
    action: 'weather',
  },
  {
    icon: TrendingUp,
    title: 'Yield Prediction',
    description: 'AI predictions for your harvest yield with 85%+ accuracy',
    action: 'yield',
  },
  {
    icon: DollarSign,
    title: 'Financial Analytics',
    description: 'Track expenses, revenue, and maximize your farm profitability',
    action: 'finance',
  },
  {
    icon: Bug,
    title: 'Disease Detection',
    description: 'Upload photos to identify crop diseases instantly',
    action: 'disease',
  },
];

export default function ChatBot({ onClose }: Props) {
  const { user, farmer } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationPhase, setConversationPhase] = useState<'greeting' | 'exploring' | 'helping'>('greeting');

  useEffect(() => {
    // Intelligent greeting based on user state
    if (user) {
      setMessages([
        {
          role: 'assistant',
          content: `Welcome back, ${farmer?.full_name || 'Farmer'}! 👋 I noticed you're using SmartFarm AI. How can I help you today?`,
          type: 'text',
        },
        {
          role: 'assistant',
          content: 'I can help you with:',
          type: 'features',
          actions: FEATURED_FEATURES.map((f) => ({ label: f.title, action: f.action })),
        },
      ]);
      setConversationPhase('exploring');
    } else {
      setMessages([
        {
          role: 'assistant',
          content: '🌾 Welcome to SmartFarm AI! I\'m your AI farming assistant. Whether you\'re exploring features or need farming advice, I\'m here to help.',
          type: 'text',
        },
        {
          role: 'assistant',
          content: 'Farmers like you have already increased yields by 40% and reduced costs by 30%. Let me show you what you can do:',
          type: 'features',
          actions: FEATURED_FEATURES.slice(0, 3).map((f) => ({ label: f.title, action: f.action })),
        },
      ]);
      setConversationPhase('greeting');
    }
  }, [user, farmer]);

  async function handleSend() {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage, type: 'text' }]);
    setLoading(true);

    const response = await generateResponse(userMessage);

    setMessages((prev) => [...prev, { role: 'assistant', content: response, type: 'text' }]);
    setLoading(false);

    if (user) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('auth_token');

      if (token) {
        try {
          await fetch(`${apiUrl}/chatbot`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              query: userMessage,
              response: response,
            }),
          });
        } catch (error) {
          console.error('Error saving chatbot query:', error);
        }
      }
    }
  }

  function handleFeatureClick(action: string) {
    const featureMap: Record<string, string> = {
      crops: 'I\'d love to help you get crop recommendations! 🌾\n\n✅ Tell me:\n1. What\'s your soil type? (Loamy, Clay, Sandy-Loam, etc.)\n2. What irrigation method do you use? (Drip, Canal, Tube Well)\n3. Which season? (Rabi, Kharif, or Year-round)\n\nBased on this, I\'ll recommend the best crops for your farm!',
      weather: 'The Weather Dashboard shows you 7-day forecasts! ⛅\n\n✅ Features:\n• Real-time weather updates\n• Rainfall predictions\n• Temperature and humidity tracking\n• Optimize irrigation timing\n• Plan planting/spraying activities\n\nThis helps you avoid crop damage and save water!',
      yield: 'Yield Prediction uses AI to forecast your harvest! 📈\n\n✅ How it works:\n• Analyzes your soil type and crop history\n• Considers weather patterns\n• Includes fertilizer & irrigation data\n• Accuracy improves after 2 seasons\n• Predicts ₹ per acre profit\n\nTypically 85%+ accurate after trained on your data!',
      finance: 'Financial Analytics helps you maximize profits! 💰\n\n✅ Track:\n• Farm expenses (seeds, fertilizers, labor)\n• Crop sales and revenue\n• Profit/loss per crop\n• Cost analysis by category\n• Compare profitability across seasons\n\nFarmers save ₹10,000+ per year just by tracking properly!',
      disease: 'Disease Detection identifies crop problems instantly! 🔍\n\n✅ How to use:\n1. Upload a photo of the affected leaf/plant\n2. AI analyzes the image\n3. Get instant disease identification\n4. Get treatment recommendations\n5. Act fast - early detection saves 80% of crops!\n\nCommon issues: Powdery mildew, leaf blight, rust, etc.',
    };

    const response = featureMap[action] || 'Great question! Tell me more about what you need.';
    setMessages((prev) => [...prev, { role: 'user', content: `Tell me about ${action}`, type: 'text' }]);
    setMessages((prev) => [...prev, { role: 'assistant', content: response, type: 'text' }]);
    setConversationPhase('helping');
  }

  async function generateResponse(query: string): Promise<string> {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('wheat') || lowerQuery.includes('crop') || lowerQuery.includes('grow')) {
      return 'For wheat cultivation, I recommend: 1) Loamy or clay soil with good drainage. 2) Sow in October-November for Rabi season. 3) Apply balanced NPK fertilizer (120:60:40 kg/ha). 4) Maintain 5-6 irrigations throughout the season. 5) Expected yield: 18-25 quintals per acre with proper care.\n\n💡 Want to explore crop recommendations based on your specific farm?';
    }

    if (lowerQuery.includes('disease') || lowerQuery.includes('pest') || lowerQuery.includes('insect') || lowerQuery.includes('blight')) {
      return 'Common crop diseases include leaf blight, powdery mildew, and aphid infestations. To prevent:\n1) Use disease-resistant varieties\n2) Maintain proper plant spacing\n3) Avoid overhead irrigation\n4) Apply fungicides preventively\n5) Remove infected plants immediately\n\n📸 Use our Disease Detection feature to upload photos and get instant identification!';
    }

    if (lowerQuery.includes('fertilizer') || lowerQuery.includes('nutrient') || lowerQuery.includes('npk')) {
      return 'Proper fertilization is key to good yields:\n1) Get your soil tested first\n2) For cereals: Apply N:P:K in ratio 4:2:1\n3) Apply basal dose at sowing, then top dress in 2-3 splits\n4) Use organic compost to improve soil health\n5) Consider micro-nutrients like zinc and iron\n\n💡 What crop are you growing? I can give specific fertilizer recommendations!';
    }

    if (lowerQuery.includes('irrigation') || lowerQuery.includes('water') || lowerQuery.includes('drip')) {
      return 'Efficient water management improves yields by 25-40%:\n1) Water in early morning/evening to reduce evaporation\n2) Drip irrigation saves 30-60% water\n3) Monitor soil moisture before irrigating\n4) Critical stages: germination, flowering, grain filling\n5) Avoid water logging\n\n📊 Check our Weather Dashboard for optimal irrigation scheduling!';
    }

    if (lowerQuery.includes('price') || lowerQuery.includes('market') || lowerQuery.includes('sell') || lowerQuery.includes('profit')) {
      return 'Market information is critical for maximizing profit:\n1) Check Live Mandi Prices for latest rates\n2) Prices peak just after season starts\n3) Crops with best margins: Mustard (₹8,200/acre), Cotton (₹6,500/acre)\n4) Store produce properly to sell at better times\n5) Plan based on seasonal trends\n\n💹 Our Financial Analytics tracks your revenue and compares profitability!';
    }

    if (lowerQuery.includes('soil') || lowerQuery.includes('land') || lowerQuery.includes('ph')) {
      return 'Understanding your soil is crucial for success:\n1) Get soil tested every 2-3 years\n2) Loamy soil is ideal for most crops\n3) Add organic matter to improve structure\n4) Maintain pH between 6-7.5\n5) Practice crop rotation\n6) Use green manuring to add nutrients\n\n🌱 During farm setup, I help estimate your soil type. What type do you have?';
    }

    if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes('what should')) {
      return 'I can recommend crops based on your farm!\n\n✅ To give you the best recommendations, I need:\n• Your soil type (Loamy, Clay, etc.)\n• Irrigation method (Drip, Canal, Tube Well)\n• Current season preference\n• Farm size and location\n\n💡 Once you set up your farm profile, you\'ll get personalized AI recommendations that improve over time!';
    }

    return 'Great question! 🤔\n\nI can help with:\n• 🌾 Crop selection & recommendations\n• 💰 Financial tracking & profit analysis\n• 🌡️ Weather forecasts & irrigation planning\n• 🔍 Disease detection from photos\n• 📈 Yield predictions\n• 🎯 Fertilizer and soil management\n\nWhat would you like to explore?';
  }

  return (
    <div className="fixed bottom-0 right-0 w-full sm:w-96 sm:h-[600px] h-screen bg-white sm:rounded-t-xl shadow-2xl border border-gray-200 flex flex-col z-50 sm:bottom-6 sm:right-6">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-xl flex items-center justify-between sticky top-0">
        <div className="flex items-center space-x-2">
          <div className="bg-white p-1 rounded-full">
            <Bot className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold">SmartFarm Assistant</h3>
            <p className="text-xs text-green-100">🟢 Online & Ready to Help</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-green-700 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`${message.role === 'user' ? 'bg-green-600 text-white max-w-[85%]' : 'w-full'} rounded-lg p-3`}>
              {message.type === 'features' && message.actions ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold mb-3">{message.content}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {message.actions.map((action, idx) => {
                      const feature = FEATURED_FEATURES.find(f => f.action === action.action);
                      const Icon = feature?.icon || Zap;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleFeatureClick(action.action)}
                          className="flex items-center gap-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-gray-800 rounded text-sm transition-colors text-left border border-green-200"
                        >
                          <Icon className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="font-medium">{action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  {message.role === 'assistant' && (
                    <Bot className="h-4 w-4 inline mr-1 text-green-600" />
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about farming..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
