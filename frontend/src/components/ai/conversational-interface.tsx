import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { useMutation } from "@tanstack/react-query";

import { useToast } from "../../hooks/use-toast";
import { Send, Sparkles, MessageSquare, TrendingUp, Globe, Dna } from "lucide-react";
import type { PipelineJob } from "@/types";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: {
    queryType?: string;
    confidence?: number;
    sources?: string[];
  };
}

interface ConversationalInterfaceProps {
  selectedJob?: PipelineJob;
}



export default function ConversationalInterface({ selectedJob }: ConversationalInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: selectedJob 
        ? `Hello! I'm your AI assistant for analyzing eDNA sequence data. I can help you explore the results from "${selectedJob.name}" using natural language queries.

For example, you could ask me to "Show me candidate new taxa" or "Generate a plain-English summary of findings". What would you like to know?`
        : `Hello! I'm your AI assistant for eDNA sequence analysis. Upload and analyze your sequences to unlock detailed insights, or ask me general questions about marine biodiversity and eDNA analysis techniques.

I can help with taxonomy identification, diversity metrics, and scientific interpretation of results.`,
      timestamp: new Date(),
      metadata: {
        queryType: 'greeting',
        confidence: 1.0
      }
    }
  ]);
  const [currentQuery, setCurrentQuery] = useState("");
  const { toast } = useToast();

  const queryMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          jobId: selectedJob?.id || 'no-job',
          context: selectedJob?.results || {} 
        })
      });
      if (!response.ok) throw new Error('Failed to process query');
      return response.json();
    },
    onSuccess: (response: any) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: response.answer,
        timestamp: new Date(),
        metadata: {
          queryType: response.queryType,
          confidence: response.confidence,
          sources: response.sources
        }
      };
      setMessages(prev => [...prev, aiMessage]);
    },
    onError: () => {
      toast({
        title: "Query Failed",
        description: "Unable to process your query. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = () => {
    if (!currentQuery.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentQuery,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    queryMutation.mutate(currentQuery);
    setCurrentQuery("");
  };



  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getQueryTypeIcon = (queryType?: string) => {
    switch (queryType) {
      case 'taxonomy': return <Dna className="w-4 h-4" />;
      case 'diversity': return <TrendingUp className="w-4 h-4" />;
      case 'geographic': return <Globe className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center">
          <MessageSquare className="mr-2 text-purple-600" />
          AI Query Interface
          <Badge variant="secondary" className="ml-2">
            Interactive
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ask natural language questions about your analysis results
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
                {message.type === 'ai' && message.metadata?.queryType && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    {getQueryTypeIcon(message.metadata.queryType)}
                    <span>Analysis • {((message.metadata.confidence || 0) * 100).toFixed(0)}% confidence</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {queryMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Analyzing your query...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator className="flex-shrink-0" />

        {/* Input */}
        <div className="p-6 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your analysis results..."
              className="flex-1"
              disabled={queryMutation.isPending}
              data-testid="input-ai-query"
            />
            <Button 
              onClick={handleSubmit}
              disabled={!currentQuery.trim() || queryMutation.isPending}
              data-testid="button-send-query"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send • Ask about taxonomy, diversity, or generate reports
          </p>
        </div>
      </CardContent>
    </Card>
  );
}