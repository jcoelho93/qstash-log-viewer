import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Settings, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QstashEvent {
  time: number;
  messageId: string;
  state: string;
  url: string;
  queueName?: string;
  header?: Record<string, string[]>;
  body?: string;
  method?: string;
  maxRetries?: number;
}

interface EventsDashboardProps {
  defaultUrl?: string;
}



const EventsDashboard = ({ defaultUrl = "http://localhost:8081" }: EventsDashboardProps) => {
  // Load from environment variables if available, fallback to default
  const initialApiUrl = import.meta.env.VITE_QSTASH_URL || defaultUrl;
  const initialBearerToken = import.meta.env.VITE_QSTASH_TOKEN || "";
  const [events, setEvents] = useState<QstashEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(initialApiUrl);
  const [showSettings, setShowSettings] = useState(false);
  const [bearerToken, setBearerToken] = useState(initialBearerToken);
  const { toast } = useToast();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (bearerToken) {
        headers["Authorization"] = `Bearer ${bearerToken}`;
      }
      const response = await fetch(`${apiUrl}/v2/logs`, {
        headers,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const events = data['events'] || []; // Ensure we handle cases where 'events' might not be present
      console.log("events: ", events); // Debugging log

      // Sort events by time (newest first)
      const sortedEvents = (Array.isArray(events) ? events : []).sort((a, b) => b.time - a.time);
      console.log(sortedEvents); // Debugging log
      setEvents(sortedEvents);

      toast({
        title: "Events refreshed",
        description: `Loaded ${sortedEvents.length} events`,
      });
    } catch (error) {
      console.error("Failed to fetch events:", error);
      toast({
        title: "Failed to fetch events",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const decodeBody = (body: string) => {
    try {
      const decoded = atob(body);
      return JSON.parse(decoded);
    } catch {
      return body;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-dashboard-gradient bg-clip-text text-transparent">
              Qstash Events Dashboard
            </h1>
            <p className="text-muted-foreground">
              Monitor and track your Qstash events in real-time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button onClick={fetchEvents} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="border-primary/20 shadow-elegant animate-slide-up">
            <CardHeader>
              <CardTitle className="text-lg">API Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <Input
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="Enter API URL"
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-3">
                  <Input
                    value={bearerToken}
                    onChange={(e) => setBearerToken(e.target.value)}
                    placeholder="Enter Bearer Token"
                    className="flex-1"
                    type="password"
                  />
                </div>
                <Button onClick={fetchEvents} disabled={loading}>
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-surface-1 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{events.length}</p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-surface-1 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Events</p>
                  <p className="text-2xl font-bold text-success">
                    {events.filter(e => e.state.toLowerCase() === 'active').length}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-surface-1 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unique Queues</p>
                  <p className="text-2xl font-bold">
                    {new Set(events.map(e => e.queueName).filter(Boolean)).size}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-info/20 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <Card className="bg-surface-1 border-primary/20 shadow-subtle">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Events</span>
              <Badge variant="secondary">{events.length} total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading events...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No events found</p>
                <p className="text-sm">Check your API endpoint or try refreshing</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event, index) => (
                  <div
                    key={event.messageId}
                    className="bg-surface-2 rounded-lg p-4 border border-border/50 hover:border-primary/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                      <div className="lg:col-span-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={getStateColor(event.state) as any}>
                              {event.state}
                            </Badge>
                            {event.queueName && (
                              <Badge variant="outline">{event.queueName}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">
                            {formatTime(event.time)}
                          </p>
                        </div>
                      </div>

                      <div className="lg:col-span-2">
                        <p className="text-sm font-medium text-foreground mb-1">URL</p>
                        <p className="text-sm text-muted-foreground font-mono break-all">
                          {event.url}
                        </p>
                        {event.method && (
                          <Badge variant="outline" className="mt-2">
                            {event.method}
                          </Badge>
                        )}
                      </div>

                      <div className="lg:col-span-2">
                        <p className="text-sm font-medium text-foreground mb-1">Message ID</p>
                        <p className="text-xs text-muted-foreground font-mono break-all">
                          {event.messageId}
                        </p>
                        {event.maxRetries && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Max retries: {event.maxRetries}
                          </p>
                        )}
                      </div>
                    </div>

                    {event.body && (
                      <details className="mt-4">
                        <summary className="text-sm cursor-pointer text-primary hover:text-primary/80">
                          View Body
                        </summary>
                        <pre className="mt-2 p-3 bg-surface-3 rounded text-xs text-muted-foreground overflow-auto font-mono">
                          {JSON.stringify(decodeBody(event.body), null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventsDashboard;
