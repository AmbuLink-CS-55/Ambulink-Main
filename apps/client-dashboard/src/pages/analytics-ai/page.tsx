import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAnalyticsAiChat } from "@/services/analytics.service";
import { toUiErrorMessage } from "@/lib/ui-error";

type TimeRangeKey = "all" | "24h" | "7d" | "30d" | "custom";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  highlights?: string[];
  generatedAt?: string;
};

const TIME_RANGE_OPTIONS = [
  { label: "All time", value: "all" },
  { label: "Last 24h", value: "24h" },
  { label: "Last 7d", value: "7d" },
  { label: "Last 30d", value: "30d" },
  { label: "Custom", value: "custom" },
] satisfies ReadonlyArray<{ label: string; value: TimeRangeKey }>;

function toIsoOrUndefined(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function resolveRange(range: TimeRangeKey, customFrom: string, customTo: string) {
  if (range === "all") return { from: undefined, to: undefined };

  if (range === "custom") {
    return {
      from: toIsoOrUndefined(customFrom),
      to: toIsoOrUndefined(customTo),
    };
  }

  const now = Date.now();
  const hours = range === "24h" ? 24 : range === "7d" ? 24 * 7 : 24 * 30;
  return {
    from: new Date(now - hours * 60 * 60 * 1000).toISOString(),
    to: new Date(now).toISOString(),
  };
}

export default function AnalyticsAiPage() {
  const aiChat = useAnalyticsAiChat();

  const [range, setRange] = useState<TimeRangeKey>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Ask analytics questions about cancellations, driver performance, demand timing, and hospitals.",
    },
  ]);

  const resolvedRange = useMemo(
    () => resolveRange(range, customFrom, customTo),
    [range, customFrom, customTo]
  );

  const onAsk = async () => {
    const normalized = question.trim();
    if (normalized.length < 3) return;

    setMessages((prev) => [...prev, { role: "user", text: normalized }]);
    setQuestion("");

    try {
      const response = await aiChat.mutateAsync({
        question: normalized,
        from: resolvedRange.from,
        to: resolvedRange.to,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response.answer,
          highlights: response.highlights,
          generatedAt: response.generatedAt,
        },
      ]);
    } catch (error) {
      console.error("[analytics-ai] request failed", error);
      const message = toUiErrorMessage(error, "Failed to fetch AI analytics response.");
      setMessages((prev) => [...prev, { role: "assistant", text: message }]);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics AI</h1>
        <p className="text-sm text-muted-foreground">Chat with provider-scoped analytics context.</p>
      </div>

      <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Time range</label>
            <Select
              value={range}
              onChange={(event) => setRange(event.target.value as TimeRangeKey)}
              options={TIME_RANGE_OPTIONS}
            />
          </div>
          {range === "custom" ? (
            <>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">From</label>
                <Input
                  type="datetime-local"
                  value={customFrom}
                  onChange={(event) => setCustomFrom(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">To</label>
                <Input
                  type="datetime-local"
                  value={customTo}
                  onChange={(event) => setCustomTo(event.target.value)}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[85%] rounded-lg bg-[color:var(--primary)] px-3 py-2 text-sm text-white"
                  : "max-w-[90%] rounded-lg border border-[color:var(--border)] bg-background px-3 py-2 text-sm text-foreground"
              }
            >
              <div>{message.text}</div>
              {message.highlights?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                  {message.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {message.generatedAt ? (
                <div className="mt-2 text-[10px] text-muted-foreground">
                  Generated: {new Date(message.generatedAt).toLocaleString()}
                </div>
              ) : null}
            </div>
          ))}
          {aiChat.isPending ? <div className="text-xs text-muted-foreground">Thinking...</div> : null}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="e.g. Why did cancellations increase in the last 7 days?"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void onAsk();
              }
            }}
          />
          <Button onClick={() => void onAsk()} disabled={aiChat.isPending || question.trim().length < 3}>
            Ask
          </Button>
        </div>
      </div>
    </div>
  );
}
