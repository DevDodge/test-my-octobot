import { trpc } from "@/lib/trpc";
import { ExternalLink, MapPin, Globe } from "lucide-react";
import { motion } from "framer-motion";

type ChatTheme = "dark" | "light";

// Known domain icons
const DOMAIN_ICONS: Record<string, typeof MapPin> = {
    "maps.app.goo.gl": MapPin,
    "maps.google.com": MapPin,
    "goo.gl": MapPin,
    "google.com/maps": MapPin,
};

function getDomainIcon(domain: string) {
    for (const [key, Icon] of Object.entries(DOMAIN_ICONS)) {
        if (domain.includes(key)) return Icon;
    }
    return Globe;
}

// Extract URLs from text
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

export function extractUrls(text: string): string[] {
    const matches = text.match(URL_REGEX);
    if (!matches) return [];
    // Filter out image URLs (already handled by formatImageUrls) and deduplicate
    const filtered = matches.filter(url =>
        !url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i)
    );
    return Array.from(new Set(filtered));
}

function SingleLinkPreview({ url, theme }: { url: string; theme: ChatTheme }) {
    const { data, isLoading } = trpc.linkPreview.fetch.useQuery(
        { url },
        { staleTime: Infinity, retry: false, refetchOnWindowFocus: false }
    );

    const isDark = theme === "dark";

    if (isLoading) {
        return (
            <div className={`rounded-xl overflow-hidden border animate-pulse ${isDark
                ? "border-white/[0.08] bg-white/[0.03]"
                : "border-gray-200 bg-gray-50"
                }`}>
                <div className="p-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${isDark ? "bg-white/[0.06]" : "bg-gray-200"}`} />
                    <div className="flex-1 space-y-1.5">
                        <div className={`h-3 w-2/3 rounded ${isDark ? "bg-white/[0.06]" : "bg-gray-200"}`} />
                        <div className={`h-2.5 w-1/2 rounded ${isDark ? "bg-white/[0.04]" : "bg-gray-100"}`} />
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const DomainIcon = getDomainIcon(data.domain);
    const hasImage = data.image && !data.image.includes("undefined");
    const displayTitle = data.title || data.siteName || data.domain;

    return (
        <motion.a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`block rounded-xl overflow-hidden border transition-all duration-200 group ${isDark
                ? "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15]"
                : "border-gray-200 bg-gray-50/80 hover:bg-gray-100 hover:border-gray-300"
                }`}
        >
            {/* Image preview if available */}
            {hasImage && (
                <div className="relative w-full h-32 overflow-hidden">
                    <img
                        src={data.image!}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className={`absolute inset-0 ${isDark
                        ? "bg-gradient-to-t from-[#0a0e1a]/60 to-transparent"
                        : "bg-gradient-to-t from-white/30 to-transparent"
                        }`} />
                </div>
            )}

            <div className="p-3 flex items-start gap-3">
                {/* Favicon / domain icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isDark
                    ? "bg-white/[0.06]"
                    : "bg-white border border-gray-200"
                    }`}>
                    {data.favicon ? (
                        <img
                            src={data.favicon}
                            alt=""
                            className="w-5 h-5 rounded-sm"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                                (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="w-5 h-5"></span>`;
                            }}
                        />
                    ) : (
                        <DomainIcon className={`w-4 h-4 ${isDark ? "text-white/40" : "text-gray-400"}`} />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {displayTitle && (
                        <p className={`text-xs font-semibold truncate leading-tight ${isDark ? "text-white/80" : "text-gray-800"}`}>
                            {displayTitle}
                        </p>
                    )}
                    {data.description && (
                        <p className={`text-[11px] mt-0.5 line-clamp-2 leading-relaxed ${isDark ? "text-white/40" : "text-gray-500"}`}>
                            {data.description}
                        </p>
                    )}
                    <div className={`flex items-center gap-1.5 mt-1.5 ${isDark ? "text-white/25" : "text-gray-400"}`}>
                        <DomainIcon className="w-3 h-3" />
                        <span className="text-[10px] truncate">{data.domain}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </div>
        </motion.a>
    );
}

export function LinkPreviews({ text, theme }: { text: string; theme: ChatTheme }) {
    const urls = extractUrls(text);
    if (urls.length === 0) return null;

    return (
        <div className="space-y-2 mt-2">
            {urls.map((url) => (
                <SingleLinkPreview key={url} url={url} theme={theme} />
            ))}
        </div>
    );
}
