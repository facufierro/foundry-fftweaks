# 🎙️ AI Narrator Roadmap

## 🎯 Vision
Transform the AI Narrator into a comprehensive storytelling assistant with message embellishment, context awareness, and voice synthesis.

---

## 📋 Implementation Phases

### Phase 1: Universal Message Embellishment ⭐ **Start Here**
**User (DM or Player) writes short message → AI embellishes → Posts to chat**

**What It Does:**
- Simple chat command (e.g., `/enhance I look around nervously`)
- AI takes short, simple text and makes it more descriptive and engaging
- Shows preview with "Approve" and "Regenerate" buttons
- Posts final message to chat

**Example:**
- **Input:** `I look around nervously`
- **AI Output:** `My eyes dart around the dimly lit chamber, hand instinctively moving to my sword hilt as shadows dance across the walls.`

**Technical Requirements:**
- [ ] Create `/enhance` chat command
- [ ] Build simple modal UI (input → AI preview → approve/regenerate)
- [ ] Gemini API integration for embellishment
- [ ] Post to Foundry chat

**Why First:** Establishes core embellishment workflow before adding complexity.

---

### Phase 2: Token/Target Integration
**Associate messages with selected tokens or targeted actors**

**What It Does:**
- Detect if user has a token selected or targeted
- Automatically attribute message to that character/NPC
- Display character portrait in chat message
- Use character context (name, class, personality) to guide AI tone

**Technical Requirements:**
- [ ] Read `canvas.tokens.controlled` (selected token)
- [ ] Read `game.user.targets` (targeted tokens)
- [ ] Pass character data to AI prompt for tone guidance
- [ ] Format chat message with speaker/portrait

**Why Second:** Adds character attribution to existing embellishment system.

---

### Phase 3: Journal Context Integration
**AI reads scene journals to improve narrative quality**

**What It Does:**
- Read active scene's pinned journals
- Read actor biographies for selected characters
- Use journal context to make embellishments more lore-accurate
- Optional: Auto-summarize session events to a journal

**Technical Requirements:**
- [ ] Read `game.scenes.active.journal` entries
- [ ] Read actor biography/notes
- [ ] Include relevant excerpts in AI prompt context
- [ ] (Optional) Create session log writer

**Why Third:** Adds depth and consistency to embellishments.

---

### Phase 4: Voice Synthesis (Final Step)
**Read any chat message aloud using ElevenLabs voice**

**What It Does:**
- Add "Speak" button to chat messages (or auto-speak setting)
- Send message text to ElevenLabs API
- Play audio directly in Foundry
- Support multiple voice profiles (narrator, NPCs, etc.)

**Technical Requirements:**
- [ ] ElevenLabs API integration
- [ ] Audio playback system
- [ ] Voice profile management (assign voices to actors)
- [ ] "Speak" button on chat cards
- [ ] Audio caching for repeated phrases

**Why Last:** Voice is expensive and should only be added after text system is perfect.

---

### Phase 5: Polish (Ongoing)
- [ ] Cost tracking dashboard (Gemini + ElevenLabs usage)
- [ ] Audio queue (prevent overlapping voices)
- [ ] Settings UI (voice profiles, embellishment style)
- [ ] Performance optimization

---

## 💰 Estimated Costs

| Service | Cost | Usage |
|---------|------|-------|
| **Gemini API** | ~$0.002 per embellishment | Text generation |
| **ElevenLabs** | $0-22/month | 10k-100k characters (Phase 4 only) |

**Phases 1-3 are essentially free.** Only Phase 4 adds recurring costs.

---

## 🚀 Next Steps

1. **Build Phase 1** (Universal embellishment `/enhance` command)
2. **Test with players and DM** to validate UX
3. **Iterate** before adding token/journal complexity
4. **Add voice only when text system is perfect**