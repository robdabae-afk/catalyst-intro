import { Newspaper, ExternalLink } from "lucide-react";
import type { NewsItem } from "@/hooks/useHomeFeed";

interface Props {
  news: NewsItem | null;
}

export function TodaysNews({ news }: Props) {
  return (
    <section className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Newspaper className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Today's news</h2>
      </div>
      {!news ? (
        <p className="text-sm text-muted-foreground">No news for today yet.</p>
      ) : (
        <div className="space-y-2">
          {news.image_url && (
            <img
              src={news.image_url}
              alt={news.title}
              className="w-full max-h-48 object-cover rounded"
            />
          )}
          <h3 className="font-semibold text-foreground">{news.title}</h3>
          {news.body && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{news.body}</p>
          )}
          {news.link && (
            <a
              href={news.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Read more <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </section>
  );
}
