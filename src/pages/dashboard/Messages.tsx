import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, Search, Phone, Video, MoreVertical, Check, CheckCheck } from "lucide-react";

const conversations = [
    {
        id: 1,
        name: "Marcus Johnson",
        avatar: "MJ",
        lastMsg: "I'll be at the pickup point in 5 min!",
        time: "9:32 AM",
        unread: 2,
        online: true,
        role: "Driver",
    },
    {
        id: 2,
        name: "Priya Sharma",
        avatar: "PS",
        lastMsg: "Perfect, see you at 6 PM 👋",
        time: "8:15 AM",
        unread: 0,
        online: true,
        role: "Driver",
    },
    {
        id: 3,
        name: "Sarah Chen",
        avatar: "SC",
        lastMsg: "Could we adjust to 8:45 AM instead?",
        time: "Yesterday",
        unread: 0,
        online: false,
        role: "Rider",
    },
    {
        id: 4,
        name: "James Kim",
        avatar: "JK",
        lastMsg: "Thanks for the great ride! ⭐⭐⭐⭐⭐",
        time: "Mar 7",
        unread: 0,
        online: false,
        role: "Driver",
    },
    {
        id: 5,
        name: "Elena Rodriguez",
        avatar: "ER",
        lastMsg: "Your airport ride is confirmed ✅",
        time: "Mar 6",
        unread: 1,
        online: false,
        role: "Driver",
    },
];

const messages = [
    { id: 1, from: "other", text: "Hey! I'm your driver for today's morning commute.", time: "9:20 AM", read: true },
    { id: 2, from: "me", text: "Great! What's your ETA to my location?", time: "9:21 AM", read: true },
    { id: 3, from: "other", text: "About 8 minutes. I'm currently on Oak Street heading towards your area.", time: "9:22 AM", read: true },
    { id: 4, from: "me", text: "Perfect, I'll head downstairs now.", time: "9:25 AM", read: true },
    { id: 5, from: "other", text: "I'm in a silver Tesla Model 3, license plate 7ABC123.", time: "9:27 AM", read: true },
    { id: 6, from: "me", text: "Got it! I see you. Heading over now 👋", time: "9:30 AM", read: true },
    { id: 7, from: "other", text: "I'll be at the pickup point in 5 min!", time: "9:32 AM", read: false },
];

const Messages = () => {
    const [activeChat, setActiveChat] = useState(conversations[0]);
    const [newMsg, setNewMsg] = useState("");
    const [msgs, setMsgs] = useState(messages);
    const [search, setSearch] = useState("");

    const sendMessage = () => {
        if (!newMsg.trim()) return;
        setMsgs([...msgs, { id: msgs.length + 1, from: "me", text: newMsg, time: "Now", read: false }]);
        setNewMsg("");
    };

    const filteredConvos = conversations.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Messages</h2>
                <p className="text-sm text-muted-foreground mt-1">Chat with your drivers and co-riders</p>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: "580px" }}>
                <div className="flex h-full">
                    {/* Sidebar */}
                    <div className="w-72 border-r border-border flex flex-col shrink-0">
                        <div className="p-4 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {filteredConvos.map((convo) => (
                                <button
                                    key={convo.id}
                                    onClick={() => setActiveChat(convo)}
                                    className={`w-full flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b border-border/50 ${activeChat.id === convo.id ? "bg-primary/5 border-primary/10" : ""
                                        }`}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-11 h-11 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold">
                                            {convo.avatar}
                                        </div>
                                        {convo.online && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald rounded-full border-2 border-card" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-sm font-semibold text-foreground truncate">{convo.name}</span>
                                            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{convo.time}</span>
                                        </div>
                                        <span className="text-[10px] text-primary font-medium">{convo.role}</span>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <span className="text-xs text-muted-foreground truncate max-w-[140px]">{convo.lastMsg}</span>
                                            {convo.unread > 0 && (
                                                <span className="ml-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center shrink-0">
                                                    {convo.unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {/* Chat header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold">
                                        {activeChat.avatar}
                                    </div>
                                    {activeChat.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald rounded-full border-2 border-card" />}
                                </div>
                                <div>
                                    <div className="font-semibold text-foreground text-sm">{activeChat.name}</div>
                                    <div className="text-xs text-muted-foreground">{activeChat.online ? "Active now" : "Offline"} · {activeChat.role}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <button className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
                                    <Video className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <button className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {msgs.map((msg, i) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
                                >
                                    {msg.from !== "me" && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold mr-2 mt-auto shrink-0">
                                            {activeChat.avatar}
                                        </div>
                                    )}
                                    <div className={`max-w-[70%] ${msg.from === "me" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.from === "me"
                                                ? "bg-gradient-primary text-white rounded-br-sm"
                                                : "bg-muted text-foreground rounded-bl-sm"
                                            }`}>
                                            {msg.text}
                                        </div>
                                        <div className="flex items-center gap-1 px-1">
                                            <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                                            {msg.from === "me" && (
                                                msg.read
                                                    ? <CheckCheck className="w-3 h-3 text-primary" />
                                                    : <Check className="w-3 h-3 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="px-6 py-4 border-t border-border">
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMsg}
                                    onChange={(e) => setNewMsg(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                    className="flex-1 bg-muted rounded-xl px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <button
                                    onClick={sendMessage}
                                    className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow hover:opacity-90 transition-opacity shrink-0"
                                >
                                    <Send className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Messages;
