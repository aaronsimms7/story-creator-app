# Story Creator App - Product Plan & Technical Specification

**Version:** 1.0  
**Last Updated:** February 12, 2026  
**Status:** Planning & Architecture Phase

---

## Table of Contents
1. [Product Vision](#product-vision)
2. [User Experience Flow](#user-experience-flow)
3. [Technical Architecture](#technical-architecture)
4. [Implementation Phases](#implementation-phases)
5. [Cost Analysis](#cost-analysis)
6. [Open Questions & Decisions](#open-questions--decisions)
7. [Success Metrics](#success-metrics)

---

## Product Vision

### Core Concept
A web-based platform that allows a parent and child to co-create a **physical, high-quality picture book** through real-time voice interaction. The app listens to their natural conversation, extracts key narrative themes, and uses generative AI to create consistent visual storytelling.

### Key Differentiators
- **Voice-first**: Natural conversation, not menu-driven
- **Real-time collaboration**: Parent and child create together
- **Visual consistency**: Same character throughout the book
- **Physical artifact**: Actual printed book they can hold
- **Audio keepsake**: Original recording preserved in QR code

### Target Audience
- **Primary**: Children ages 3-10 with optional parent involvement
- **Secondary**: Parents looking for creative screen time activities
- **Extended**: Grandparents, teachers, gift-givers

---

## User Experience Flow

### Phase 0: The Landing Page

**Visuals:**
- High-energy montage of AI-generated storybook styles (3D, watercolor, claymation, pixel art)
- As users complete stories, characters from **past stories** appear in the montage
- Animated transitions between different art styles
- Sample "book covers" showcasing what's possible

**Primary Action:**
- Single, prominent **"Start Creating"** button
- Large, colorful, impossible to miss
- Maybe animated with a subtle pulse or glow

**Future Feature:**
- Clicking an image in the montage "seeds" the story with that visual style or theme
- "Start from this style" option
- Gallery of community stories (with permission)

**Technical Notes:**
- Gallery stored in database with thumbnails
- User authentication to load past stories
- Lazy loading for performance
- **Past characters appear on landing page** for returning users
  - "Continue [Character's] Adventure" option
  - Build character portfolio over time

**Character Reuse Feature:**
- Logged-in users see their previous characters
- Click character → "Create sequel" or "Start new story"
- Visual seed automatically loaded for sequels
- Maintains consistency across books

---

### Phase 0.5: Art Style Selection

**Before Story Creation:**
After clicking "Start Creating", user selects art style preference.

**UX:**
- "Choose your story's style!" heading
- Grid of 6-8 style options with example illustrations:
  - 🎨 Watercolor (soft, dreamy)
  - ✏️ Pencil Sketch (classic, hand-drawn)
  - 🖍️ Crayon/Kids Drawing (playful, crude)
  - 🎭 3D Render (modern, Pixar-like)
  - 🏺 Claymation (tactile, Wallace & Gromit)
  - 📐 Geometric/Minimalist (clean, modern)
  - 🌈 Pop Art (bold, colorful)
  - 📚 Classic Storybook (traditional illustration)

**Each option shows:**
- Sample character in that style
- Style name + brief description
- Preview of what their book might look like

**Technical:**
- Style choice stored in session state
- Passed to all image generation prompts
- Can't change mid-story (consistency)
- V2.0: Show same character in 2 styles, let them pick
- V3.0: Style intensity slider

**V2.0 Enhancement:**
After first character is generated, show it in 2-3 different styles:
```
"Here's your character! Which style do you like better?"
[Same dragon in watercolor] [Same dragon in 3D] [Same dragon in sketch]
```

User picks → that becomes locked style for entire book.

**V3.0 Enhancement:**
Style mixing slider:
```
Watercolor ←─────●────→ 3D Render
```
Generate hybrid styles for unique looks.

---

### Phase 1: Topic Extraction & Initial Visualization

#### Step 1.1: Initial Recording
**UX:**
- User clicks "Start"
- Large recording button appears with visual feedback:
  - Pulsing red circle
  - Waveform animation showing voice input
  - Timer display (e.g., "0:45 / 1:00")
- Suggested prompt appears: 
  > "Tell me about your story idea! Who is the main character? What do they look like? What adventure will they have?"

**Technical:**
- Use browser's `MediaRecorder API` (no plugins needed)
- Record as WebM audio
- Max duration: 60 seconds for first recording
- Show visual feedback of audio levels
- "Stop" and "Re-record" buttons

#### Step 1.2: Transcription
**UX:**
- "Listening to your story..." loading state with fun animation
- Display transcribed text as it processes
- "Is this what you said?" confirmation

**Technical:**
- Send audio blob to server endpoint `/api/transcribe`
- Server forwards to **OpenAI Whisper API**
- Return transcription + timestamps
- Cost: ~$0.006 per minute (~$0.006 per initial recording)

**Error Handling:**
- If transcription fails: "Oops! Can you try again?"
- If audio is unclear: "I couldn't hear that clearly. Want to try again?"
- Fallback: Text input option

#### Step 1.3: Topic Identification
**UX:**
- "Finding your character..." loading state
- Brief analysis happens server-side

**Technical:**
- Send transcription to **Claude 3.5 Sonnet** with prompt:
  ```
  Analyze this child's story idea: [transcription]
  
  Extract:
  1. Main character (name, type, personality)
  2. Key visual details (appearance, colors, distinguishing features)
  3. Setting/world
  4. Core conflict or adventure
  
  Return as JSON.
  ```
- Parse response
- Store in story state

#### Step 1.4: Initial Image Generation
**UX:**
- "Creating your character..." with progress indicator
- First image appears with magical reveal animation
- Show the image prominently with feedback options:
  - ❤️ "Perfect! Let's continue"
  - 🔄 "Close, but change something"
  - ❌ "Start over"

**Technical:**
- Send to **Flux.1 [dev] via Replicate API**
- Prompt template:
  ```
  Children's book illustration, [art style], featuring [character description],
  [visual details], bright colors, friendly, age-appropriate, high quality,
  professional illustration
  ```
- Generate at 1024x1024 initially (can upscale later)
- Save image URL and generation parameters
- Cost: ~$0.02-0.04 per image

**Visual Consistency Strategy:**
- Save the successful image + seed + parameters as the **Visual Reference**
- For future images, use **IP-Adapter** or **ControlNet** with this reference
- Include reference image in all subsequent generation prompts
- Maintain consistent prompt structure

#### Step 1.5: Interactive Adjustment Loop
**UX:**
- If user selects "Change something":
  - New recording button: "Tell me what to change!"
  - 15-30 second recording
  - Show modification in real-time
- If user selects "Start over":
  - Return to step 1.1
- Show iteration count: "Try 1 of 5" (limit to prevent infinite loops)

**Technical:**
- Transcribe feedback
- Extract modification instructions with Claude
- Regenerate image with modified prompt + original reference
- Keep previous versions in case they want to go back

**Lock-in:**
- Once user clicks "Perfect!", save:
  - Final character image
  - Character description
  - Visual parameters (seed, model settings)
  - This becomes the **Visual Seed** for the entire book

---

### Phase 2: Dynamic Storytelling

#### The Conversational Loop
**UX:**
- Main screen shows:
  - Current character image (locked)
  - "What happens next?" prompt
  - Recording button (always available)
  - Story progress indicator (e.g., "3 story beats captured")
  - Timeline/storyboard view of captured moments

**Interaction Pattern:**
1. Child talks (30-60 seconds)
2. AI transcribes and identifies "Story Beat"
3. AI generates WIP sketch for that beat
4. AI asks probing question to advance the story
5. Repeat

**Technical:**
- Continuous recording with chunking
- Process each chunk separately
- Build narrative state incrementally

#### Proactive AI Guidance
**Strategy:**
- AI interrupts every 30-45 seconds (configurable)
- Questions are contextual based on story state

**Example Progression:**
```
Beat 1: "And then Sparky flew to the castle!"
AI: "Wow! What did the castle look like?"

Beat 2: "It was made of ice and sparkles!"  
AI: "Beautiful! Who did Sparky meet there?"

Beat 3: "A friendly penguin named Pete!"
AI: "What did Pete need help with?"
```

**Technical Implementation:**
- Use **OpenAI Realtime API** for low-latency, natural interruptions
- Alternative: Timed prompts with Claude API (slightly higher latency)
- Story State tracks:
  - Characters introduced
  - Current setting
  - Conflict/challenge
  - Story arc position (beginning/middle/climax/resolution)

**Prompt Template:**
```
Current story state:
- Characters: [list]
- Setting: [description]
- Current situation: [summary]
- Story beats so far: [list]

The child just said: "[latest transcription]"

Tasks:
1. Identify if this is a new story beat (significant plot point)
2. Generate an appropriate follow-up question to:
   - Deepen character development
   - Advance the plot
   - Add sensory details
   - Move toward resolution (if 8+ beats captured)
3. Keep questions simple, fun, age-appropriate
4. Return as JSON: {is_beat: bool, question: string, beat_summary: string}
```

#### Visual Feedback (WIP Sketches)
**UX:**
- For each major story beat, generate a quick illustration
- Shows "Creating scene..." loading state
- Sketch appears in timeline/storyboard
- User can click to regenerate if needed

**Technical:**
- Generate "sketch" versions first (faster, cheaper)
- Use same Flux.1 model with "sketch" style modifier
- Include Visual Seed reference for character consistency
- Store beat + image association
- Cost: ~$0.02 per beat × ~8-10 beats = $0.16-0.20 per story

**Optimization:**
- Don't generate image for EVERY sentence
- Only on significant story beats
- Parent has "skip image" option to save cost/time

#### Parent Control Dashboard
**UX:**
- Small, unobtrusive panel for parent
- Hotkeys/buttons:
  - ⏭️ "Move forward" (if story is dragging)
  - 📖 "Add detail" (if too sparse)
  - 🎬 "More action"
  - 🏁 "Time to wrap up"
  - ⏸️ "Pause" (to have conversation without recording)

**Technical:**
- These inject context into the AI's next prompt
- Modify the conversation strategy
- Update story state flags

---

### Phase 3: Finalization & Fulfillment

#### Step 3.1: Story Review
**UX:**
- "Let's look at your story!" transition
- Show storyboard of all beats
- Option to:
  - Reorder scenes
  - Remove scenes
  - Add missing scenes
  - Regenerate specific images

**Technical:**
- Display all captured beats + images
- Drag-and-drop reordering
- Edit mode for each beat

#### Step 3.2: Narrative Polishing
**UX:**
- "Making your story perfect..." loading state
- Show progress: "Writing page 1 of 12..."

**Technical:**
- Send all story beats + transcriptions to Claude
- Prompt:
  ```
  You are a children's book author. Take these story beats from a child's 
  conversation and create a coherent, engaging 10-20 page story.
  
  Story beats: [all beats]
  Original transcripts: [all transcripts]
  Main character: [character details]
  
  Requirements:
  - Age-appropriate (5-10 years)
  - Clear narrative arc
  - Each page: 1-3 sentences
  - Maintain child's voice and creativity
  - Add sensory details and emotion
  - Proper story structure (beginning, middle, climax, resolution)
  
  Return as JSON array of pages with:
  - page_number
  - text (1-3 sentences)
  - scene_description (for final image generation)
  - associated_beat_id (which original beat this came from)
  ```

**Output:**
- Structured story with 10-20 pages
- Each page paired with scene description
- Maps back to original beats

#### Step 3.3: Final Image Generation
**UX:**
- "Creating your book illustrations..."
- Progress bar showing image generation
- Preview appears as each completes

**Technical:**
- For each page:
  - Use associated beat image OR generate new one
  - Use full-quality settings (1024x1024 or higher)
  - Apply Visual Seed for consistency
  - Include scene_description in prompt
- Cost: ~$0.04 × 12-15 pages = $0.48-0.60

**Quality Settings:**
- Higher inference steps for final images
- Potentially upscale to 2048x2048 for print
- Apply style consistency filters

#### Step 3.4: Book Layout & Preview
**UX:**
- Interactive book preview
- Page-flip animation
- "Read to me" option (text-to-speech)
- Edit mode if they want changes

**Technical:**
- Use canvas library or PDF generation library
- Standard book dimensions: 8.5" × 8.5" or 8" × 10"
- Professional layout template:
  - Image on top 2/3 of page
  - Text on bottom 1/3
  - Page numbers
  - Title page
  - Credits page ("Created by [Child's Name] with AI")

**Python Libraries:**
- **ReportLab** or **Pillow** for PDF generation
- Custom template system
- High-resolution output (300 DPI minimum for print)

#### Step 3.5: Audio Keepsake Integration
**UX:**
- "Add audio memories" option
- Shows QR code that will be on back cover
- Test it by scanning with phone

**Technical:**
- Upload original audio recordings to cloud storage (S3, Cloudinary, etc.)
- Generate QR code pointing to audio URL
- Add QR code to back cover of book
- Consider: Concatenate all recordings into single "story time" audio file

#### Step 3.6: Order & Fulfillment
**UX:**
- "Ship my book!" button
- Pricing display: $XX.XX
- Shipping address form
- Payment via Stripe
- Order confirmation with tracking

**Technical:**
- Generate print-ready PDF (CMYK, 300 DPI, bleeds)
- Send to Print-on-Demand API:
  - **Lulu** (API available, good quality)
  - **Blurb** (premium quality, higher cost)
  - **Printful** (good for testing, faster)
  - **BookBaby** (traditional quality)
- Webhook to track order status
- Email confirmation with preview PDF

**Pricing Model:**
- Base cost (printing): $8-15 depending on page count
- Platform fee: $5-10
- Shipping: $4-8
- **Total to customer: $19.99-29.99**

**Print Provider:** TBD (researching Lulu, Blurb, Printful, BookBaby)

#### Step 3.7: Digital Book Formats & Reader Experience
**Formats to Generate:**

1. **PDF** (Standard)
   - High-resolution for printing (300 DPI)
   - Downloadable for keeping/sharing
   - Optimized file size for emailing

2. **EPUB** (E-readers)
   - For iBooks, Kindle, Kobo
   - Reflowable text for different screen sizes
   - Embedded images
   - Table of contents navigation

3. **Interactive Web Reader** (Premium Experience)
   - Makes digital version worth paying for
   - Keeps users engaged on platform

**Web Reader Features:**

**Core Features (MVP):**
- Page-turning animations (react-pageflip or turn.js)
- Swipe to turn on mobile
- Full-screen reading mode
- Progress indicator
- Bookmark current page
- "Read to Me" button (Google TTS)

**Enhanced Features (V1.5):**
- Night mode for bedtime reading
- Adjustable text size
- Background music toggle (optional gentle instrumentals)
- Sound effects on page turn
- Parent can record themselves reading (audio overlay)

**Dynamic Visual Effects (V2.0):**
- Subtle parallax scrolling (background moves slower than foreground)
- Ambient animations:
  - Character blinks occasionally
  - Trees sway gently
  - Water ripples
  - Stars twinkle
- Tap elements for micro-interactions (character waves, object wiggles)
- Ken Burns effect (slow zoom/pan on images)
- Keep animations subtle - shouldn't distract from story

**Technical Implementation:**
```javascript
// Using react-pageflip or similar
<HTMLFlipBook
  width={600}
  height={800}
  size="stretch"
  minWidth={315}
  maxWidth={1000}
  minHeight={400}
  maxHeight={1350}
  showCover={true}
  flippingTime={1000}
  style={{ margin: "0 auto" }}
>
  {pages.map((page, index) => (
    <div key={index} className="page">
      <img src={page.image} alt={page.alt} />
      <div className="text">{page.text}</div>
      {page.hasAudio && <AudioPlayer src={page.audioUrl} />}
    </div>
  ))}
</HTMLFlipBook>
```

**Why This Matters:**
- Makes digital book feel premium (not just a PDF)
- Increases perceived value of digital-only option
- Encourages users to read on platform (engagement)
- Shareability - easier to send link than PDF
- Future: Can track which pages kids spend most time on (analytics)

---

## Technical Architecture

### Core Tech Stack

#### Frontend
- **Framework:** Next.js (React with SSR)
  - Why: Built-in API routes, great for SEO, optimal performance
- **Styling:** Tailwind CSS (already in prototype)
- **State Management:** Zustand or Context API
- **Audio Recording:** MediaRecorder API (native browser)
- **Real-time Updates:** WebSockets or Server-Sent Events

#### Backend / Orchestrator
- **Language:** Python (FastAPI)
  - Why: Best ecosystem for AI/ML integrations
  - Fast, async, great for API orchestration
- **Alternative:** Node.js/Express (if team is JS-focused)

#### Database
- **Primary:** PostgreSQL
  - Store user accounts, story metadata, order history
- **File Storage:** Google Cloud Storage
  - Audio recordings
  - Generated images
  - Final PDFs
  - Using existing Google Cloud account
- **Cache:** Redis (for session state, story state)

#### AI Services

| Service | Provider | Purpose | Cost (approx) | Notes |
|---------|----------|---------|---------------|-------|
| Transcription | Google Speech-to-Text | Audio → Text (streaming) | $0.024/min | Using existing Google Cloud account |
| Story Brain | Claude 3.5 Sonnet | Narrative generation, topic extraction, conversational guidance | $3/M input tokens, $15/M output tokens | Timed prompts (45-90 sec intervals) |
| Image Generation | Flux.1 [dev] (Replicate) | Character & scene illustrations | ~$0.025 per image | IP-Adapter for consistency |
| Text-to-Speech | Google Cloud TTS | Optional "Read to me" feature | ~$0.002 per book | V2: Offer ElevenLabs premium upgrade |

#### Additional Services
- **Authentication:** Clerk or Auth0
- **Payments:** Stripe
- **Email:** SendGrid or Postmark
- **Analytics:** PostHog or Mixpanel
- **Print-on-Demand:** Lulu or Blurb API

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User's Browser                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Next.js    │  │  Recording   │  │  Real-time   │     │
│  │   Frontend   │  │    UI        │  │   Updates    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Python)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Endpoints:                                      │  │
│  │  /api/transcribe  /api/generate-image               │  │
│  │  /api/story-beat  /api/finalize                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────┬────────────────┬──────────────────┬───────────────┘
          │                │                  │
          ▼                ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │  │  AWS S3 /    │
│   Database   │  │   (Cache)    │  │  Cloudinary  │
└──────────────┘  └──────────────┘  └──────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    External AI Services                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Whisper │ │  Claude  │ │  Flux.1  │ │ Realtime │      │
│  │   API    │ │   API    │ │   API    │ │   API    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Print & Delivery                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │   Lulu   │ │  Stripe  │ │ SendGrid │                    │
│  │   API    │ │ Payments │ │  Email   │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Key Technical Challenges & Solutions

#### Challenge 1: Visual Consistency
**Problem:** Character needs to look identical across 10-20 images

**Chosen Solution: IP-Adapter with Reference Image**

**Implementation:**
- Use first approved character image as **Visual Reference**
- Include reference in every subsequent generation via IP-Adapter
- Flux.1 supports image conditioning natively
- Maintain detailed character description across all prompts
- Use consistent style parameters

**V2.0 Option:** Consider LoRA fine-tuning for premium tier if IP-Adapter proves insufficient

#### Challenge 2: Real-time Interruptions
**Problem:** AI needs to ask questions at natural moments without interrupting too frequently

**Solution: Smart Timed Prompts with Pause Detection**

Implementation Strategy:
```javascript
const interruptionConfig = {
  minTimeBetweenPrompts: 45,    // Never interrupt before 45 seconds
  maxTimeBetweenPrompts: 90,    // Always check in by 90 seconds  
  pauseDetectionLength: 3,      // Wait for 3-second pause
  modes: {
    minimal: { min: 60, max: 120 },    // Parent can adjust
    normal: { min: 45, max: 90 },
    frequent: { min: 30, max: 60 }
  }
}
```

**How it works:**
1. Listen continuously with Google Speech-to-Text streaming
2. Detect natural pauses (3+ seconds of silence)
3. Only prompt when:
   - Child has been talking 45+ seconds AND pauses
   - OR 90 seconds elapsed (prompt at next pause)
4. Never interrupt mid-sentence

**User Controls:**
- Parent dashboard: "Interruption: Minimal / Normal / Frequent"
- "Let them tell their story" mode (only prompts at major story beats)
- Visual indicator 3 seconds before AI will speak (parent veto button)

**Cost Savings:**
- Google Speech-to-Text: $0.024/min (~60% cheaper than OpenAI Whisper)
- Claude API for questions: $0.03-0.05 per session
- Total: ~$0.10-0.15 per story vs. $1.50+ with Realtime API
- **Savings: ~90%**

**Future Upgrade Path:**
- V2.0: Offer OpenAI Realtime API as premium feature ($2.99 upgrade)
- More natural interruptions for users who want it
- A/B test which users prefer

#### Challenge 3: State Management
**Problem:** Track complex story state across conversation

**Story State Schema:**
```json
{
  "session_id": "uuid",
  "character": {
    "name": "Sparky",
    "type": "dragon",
    "description": "small blue dragon with yellow spots",
    "visual_seed": "image_url_or_params"
  },
  "beats": [
    {
      "id": "beat_1",
      "timestamp": "2026-02-12T10:30:00Z",
      "transcription": "...",
      "summary": "Sparky discovers the castle",
      "image_url": "...",
      "characters_present": ["Sparky"],
      "setting": "ice castle"
    }
  ],
  "current_setting": "ice castle",
  "active_characters": ["Sparky", "Pete the Penguin"],
  "story_arc_position": "rising_action",
  "conversation_history": [],
  "parent_flags": {
    "wants_to_wrap_up": false,
    "requested_more_action": true
  }
}
```

**Storage:**
- Active sessions in Redis (fast access)
- Completed stories in PostgreSQL
- Sync between both

#### Challenge 4: Automated Layout
**Problem:** Generate professional print-ready PDFs

**Solution using ReportLab:**
```python
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Image, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

def generate_book_pdf(story_data):
    pdf = SimpleDocTemplate("book.pdf", pagesize=(8.5*inch, 8.5*inch))
    elements = []
    
    for page in story_data['pages']:
        # Add image (top 2/3)
        img = Image(page['image_url'], width=7*inch, height=5.5*inch)
        elements.append(img)
        
        # Add text (bottom 1/3)
        text = Paragraph(page['text'], style=custom_style)
        elements.append(text)
        
        # Page break
        elements.append(PageBreak())
    
    pdf.build(elements)
```

---

## Implementation Phases

### Phase 0: Foundation (Week 1-2)
**Goal:** Project setup and core infrastructure

- [x] GitHub repository created
- [x] Basic Next.js app running
- [x] FastAPI backend skeleton
- [ ] Database schema designed
- [ ] Authentication setup (Clerk/Auth0)
- [ ] Environment variables configured
- [ ] Development/staging/production environments

**Deliverable:** Working dev environment with auth

---

### Phase 1: Audio Recording & Transcription (Week 2-3)
**Goal:** User can record voice and see transcription

**Frontend Tasks:**
- [ ] Create recording UI component
  - Large record button
  - Visual feedback (waveform, timer)
  - Playback functionality
  - Re-record option
- [ ] Upload audio to backend
- [ ] Display transcription results
- [ ] Error handling & retry logic

**Backend Tasks:**
- [ ] Endpoint: `POST /api/transcribe`
- [ ] Integrate OpenAI Whisper API
- [ ] Store audio files in S3/Cloudinary
- [ ] Return transcription + metadata
- [ ] Handle errors gracefully

**Testing:**
- Record various audio clips
- Test with different accents/ages
- Verify transcription accuracy
- Test error scenarios (no audio, bad connection)

**Cost Estimate:** $0.50 (testing with ~80 recordings)

**Deliverable:** Working audio recording and transcription

---

### Phase 2: Character Creation & Visual Lock (Week 3-4)
**Goal:** Generate first character image and iterate until approved

**Frontend Tasks:**
- [ ] Topic extraction loading UI
- [ ] Display first generated image
- [ ] Feedback buttons (Perfect/Change/Start Over)
- [ ] Modification recording flow
- [ ] Show iteration count
- [ ] "Locked" state when approved

**Backend Tasks:**
- [ ] Endpoint: `POST /api/extract-character`
  - Send transcription to Claude
  - Parse character details
  - Return structured data
- [ ] Endpoint: `POST /api/generate-image`
  - Send to Flux.1 via Replicate
  - Store image URL
  - Return image + metadata
- [ ] Endpoint: `POST /api/modify-image`
  - Extract modification from voice
  - Regenerate with changes
  - Maintain visual consistency
- [ ] Store Visual Seed for session

**Testing:**
- Test various character descriptions
- Verify image quality
- Test modification flow
- Ensure consistency across regenerations

**Cost Estimate:** $1-2 (100-150 image generations during testing)

**Deliverable:** Character can be created and locked

---

### Phase 3: Story Beat Capture (Week 4-6)
**Goal:** Continuous story recording with AI guidance

**Frontend Tasks:**
- [ ] Main storytelling interface
  - Current character image displayed
  - Record button always available
  - Story progress indicator
  - Timeline/storyboard view
- [ ] Display AI questions/prompts
- [ ] Show WIP sketches as they generate
- [ ] Parent control dashboard
  - Pause/resume
  - Nudge buttons
  - Wrap-up signal

**Backend Tasks:**
- [ ] Endpoint: `POST /api/story-beat`
  - Transcribe new audio chunk
  - Identify if it's a story beat
  - Update story state
  - Generate follow-up question
  - Return question + beat summary
- [ ] Endpoint: `POST /api/generate-scene`
  - Generate WIP sketch for beat
  - Use Visual Seed for consistency
  - Store image + beat association
- [ ] Story State management
  - Redis for active sessions
  - Track characters, settings, arc position
  - Conversation history
- [ ] Optional: OpenAI Realtime API integration
  - Low-latency interruptions
  - Natural conversation flow

**Testing:**
- Complete full story with child tester
- Verify AI questions make sense
- Test parent controls
- Ensure state persists correctly

**Cost Estimate:** $2-3 (testing 20-30 complete story sessions)

**Deliverable:** End-to-end story creation works

---

### Phase 4: Story Finalization (Week 6-7)
**Goal:** Polish transcript into book and generate final images

**Frontend Tasks:**
- [ ] Story review interface
  - Storyboard of all beats
  - Drag-to-reorder
  - Edit/delete beats
- [ ] Polishing progress indicator
- [ ] Book preview
  - Page-flip UI
  - Full layout preview
  - Edit mode

**Backend Tasks:**
- [ ] Endpoint: `POST /api/finalize-story`
  - Send all beats to Claude
  - Generate structured 10-20 page story
  - Return pages with scene descriptions
- [ ] Endpoint: `POST /api/generate-final-images`
  - Generate high-quality images for each page
  - Use Visual Seed for consistency
  - Upscale to print resolution
- [ ] PDF generation system
  - Layout engine (ReportLab)
  - Template system
  - High-res output (300 DPI)
  - Add QR code for audio

**Testing:**
- Generate multiple complete books
- Review narrative quality
- Check image consistency
- Verify PDF quality

**Cost Estimate:** $3-5 (15-20 complete book generations)

**Deliverable:** Complete book PDF ready for print

---

### Phase 5: Print Integration & Payments (Week 7-8)
**Goal:** User can order physical book

**Frontend Tasks:**
- [ ] Order form
  - Shipping address
  - Pricing display
  - Preview final book
- [ ] Stripe payment integration
- [ ] Order confirmation page
- [ ] Order tracking

**Backend Tasks:**
- [ ] Endpoint: `POST /api/create-order`
  - Store order in database
  - Charge via Stripe
  - Return order ID
- [ ] Print-on-Demand integration
  - Choose provider (Lulu/Blurb/Printful)
  - API integration
  - Upload PDF
  - Create order
  - Webhook for status updates
- [ ] Email system
  - Order confirmation
  - Shipping notification
  - PDF attachment

**Testing:**
- Test Stripe in test mode
- Order test print from POD provider
- Verify quality of printed book
- Test entire flow end-to-end

**Cost Estimate:** $50-100 (ordering 3-5 test prints)

**Deliverable:** Users can order and receive physical books

---

### Phase 6: Polish & Launch Prep (Week 8-10)
**Goal:** Production-ready MVP

**Tasks:**
- [ ] Error handling everywhere
- [ ] Loading states polished
- [ ] Mobile responsive design
- [ ] Accessibility (WCAG AA)
- [ ] Analytics integration
- [ ] Performance optimization
  - Image lazy loading
  - Code splitting
  - CDN setup
- [ ] Security audit
  - API rate limiting
  - Input validation
  - XSS prevention
- [ ] User testing with real families
- [ ] Bug fixes from testing
- [ ] Documentation
  - User guide
  - FAQ
  - Support system

**Deliverable:** Production-ready app

---

## Cost Analysis

### Development Phase Costs

| Phase | Service Usage | Estimated Cost |
|-------|--------------|----------------|
| Phase 1 | Testing transcription (80 clips) | $0.50 |
| Phase 2 | Character generation (100-150 images) | $2.00 |
| Phase 3 | Story sessions (20-30 complete) | $3.00 |
| Phase 4 | Book finalization (15-20 books) | $5.00 |
| Phase 5 | Test prints (3-5 books) | $75.00 |
| **Total Development** | | **~$85-100** |

### Per-Story Production Costs

| Service | Cost per Story | Notes |
|---------|----------------|-------|
| Transcription (Google Speech-to-Text) | $0.12-0.24 (5-10 min streaming) | Using existing GCP account |
| Character Generation (Claude + Images) | $0.15-0.25 | Topic extraction + initial image + iterations |
| Story Beats (Claude + WIP images) | $0.15-0.25 | Timed prompts ~90% cheaper than Realtime API |
| Final Polish (Claude) | $0.05-0.10 | Transform transcript to book narrative |
| Final Images (10 pages) | $0.25-0.40 | High-quality with IP-Adapter |
| Text-to-Speech (Google Cloud) | $0.002 | "Read to Me" feature essentially free |
| Audio Storage (GCS) | $0.01 | QR code audio keepsake |
| **Subtotal (Digital)** | **$0.73-1.24** | ~40% cheaper with Google services |
| Print-on-Demand | $8-15 (varies by page count) | TBD: Lulu/Blurb/Printful |
| Shipping | $4-8 | Varies by location |
| **Total Cost per Book** | **$12.73-24.24** |

### Pricing Strategy

**Customer Pricing:**
- **Digital Book Only:** $9.99
- **Digital + Physical:** $29.99
- **Physical Only:** $24.99

**Margins:**
- Digital: $9.99 - $1.24 = **$8.75 profit** (88% margin) ⬆️
- Physical: $29.99 - $24.24 = **$5.75 profit** (19% margin)

**Cost Savings vs. Original Plan:**
- Using Google Cloud services: ~$0.20 saved per book
- Using timed prompts vs. Realtime API: ~$1.00+ saved per book
- **Total savings: ~40% on digital costs**

**At Scale (100 books/month):**
- Revenue: $2,999 (all physical)
- Costs: $2,432
- **Profit: $567/month**

**At Scale (1,000 books/month):**
- Revenue: $29,990
- Costs: $24,320
- **Profit: $5,670/month**

### Break-Even Analysis
- Development: ~$100
- Break-even: ~18 physical books or 12 digital books
- Very achievable for MVP validation

---

## Decisions Made & Open Questions

### Product Decisions ✅
- [x] **Age range:** 3-10 years old (broader range accommodates different development levels)
- [x] **Parent involvement:** Suggested but optional - if kid wants to create solo, that's fine
- [x] **Story length:** Start with fixed 10 pages for MVP, flexible 8-20 pages post-beta
- [x] **Art style:** User selects from fixed options upfront
  - V2.0: Show two versions of same scene in different styles (interactive selection)
  - V3.0: Slider to adjust style intensity
- [x] **Multi-character stories:** Yes, allowed! Main artistic focus on protagonist
  - V2.0: More detailed art for supporting characters
- [x] **Series capability:** YES! Past characters appear on home page for reuse
  - Build portfolio of characters
  - "Continue [Character's] Adventure" option

### Technical Decisions ✅
- [x] **Realtime vs. Timed prompts:** Timed Claude calls (45-90 sec with pause detection)
  - Cost savings: ~90%
  - V2.0: Offer OpenAI Realtime as premium upgrade
- [x] **Image consistency:** IP-Adapter with reference image
  - V2.0: Consider LoRA for premium tier
- [x] **Storage:** Google Cloud Storage (existing account)
- [x] **Database:** PostgreSQL (decision finalized)
- [x] **Print provider:** TBD - researching options (Lulu, Blurb, Printful, BookBaby)
- [x] **Frontend framework:** Next.js (confirmed)

### Business Decisions 🔄
*Deferred to post-MVP - focus on building first*
- [ ] **Freemium model:** Free digital + paid print, or all paid?
- [ ] **Subscription:** Offer monthly unlimited for $X?
- [ ] **B2B opportunity:** Sell to schools/libraries?
- [ ] **Licensing:** Offer white-label to other companies?
- [ ] **Privacy:** How do we handle children's data (COPPA compliance)?

### UX Decisions ✅
- [x] **Onboarding:** YouTube video tutorial (simple, effective)
- [x] **Sample stories:** Not needed for MVP
- [x] **Saving progress:** YES - users can return to finish later
- [x] **Sharing:** YES - can share digital version with friends/family
- [x] **Multilingual:** English only for V1, other languages later

### New Decisions Documented 📝
- [x] **Text-to-Speech:** Google Cloud TTS for "Read to Me" feature (~free)
  - V2.0: ElevenLabs premium voices as $2.99 upgrade
- [x] **Digital formats:** PDF + EPUB + Interactive web reader
- [x] **Web reader features:** Page-turning, night mode, bookmarks, TTS
  - V2.0: Subtle animations, parallax effects
- [x] **Interruption frequency:** Smart pause detection, parent controls
  - Minimal/Normal/Frequent modes
  - Visual warning before AI speaks
- [x] **Transcription:** Google Speech-to-Text streaming (existing account)

---

## Success Metrics

### Product Metrics
- **Completion Rate:** % of users who finish a story (target: >60%)
- **Time to Complete:** Average session length (target: 15-30 min)
- **Iteration Count:** How many times users regenerate character (target: <3)
- **Story Quality:** Parent satisfaction rating (target: 4.5/5)
- **Re-engagement:** % who create second book (target: >30%)

### Business Metrics
- **Conversion Rate:** Digital → Physical purchase (target: >40%)
- **Average Order Value:** (target: $29.99)
- **Customer Acquisition Cost:** (target: <$10)
- **Lifetime Value:** (target: >$60 - 2 books)
- **Net Promoter Score:** (target: >50)

### Technical Metrics
- **API Costs per Book:** (target: <$1.50)
- **Page Load Time:** (target: <2 seconds)
- **Error Rate:** (target: <1%)
- **Uptime:** (target: 99.9%)

---

## Risk Assessment & Mitigation

### Risk 1: Image Consistency Fails
**Probability:** Medium  
**Impact:** High (breaks core value prop)

**Mitigations:**
- Start with IP-Adapter approach (proven)
- Have manual review step if needed
- Budget for LoRA training if IP-Adapter insufficient
- Worst case: Limit to single illustration + variations

### Risk 2: Content Moderation
**Probability:** Low  
**Impact:** High (inappropriate content in kids' app)

**Mitigations:**
- Content filters on all AI outputs
- Human review for first 100 books
- Parental oversight required
- Clear content policy
- Emergency stop button for parents

### Risk 3: Cost Overruns
**Probability:** Medium  
**Impact:** Medium (could make unit economics unviable)

**Mitigations:**
- Hard limits on regenerations
- Optimize prompts to reduce tokens
- Cache common responses
- Consider cheaper models for non-critical tasks
- Monitor costs daily during beta

### Risk 4: Print Quality Issues
**Probability:** Medium  
**Impact:** High (physical product must be excellent)

**Mitigations:**
- Order test prints from multiple providers
- Set minimum image resolution requirements
- Professional pre-press review
- Clear preview before ordering
- Easy refund/reprint policy

### Risk 5: Transcription Accuracy
**Probability:** Medium  
**Impact:** Medium (could frustrate users)

**Mitigations:**
- Use Whisper (industry-leading accuracy)
- Show transcription for confirmation
- Easy re-record option
- Text input fallback
- Test with various accents/ages

---

## Future Feature Ideas

### V2.0 Features
- [ ] **Multi-character support:** Add friends to the adventure
- [ ] **Interactive elements:** Touch-and-feel textures on print
- [ ] **Augmented Reality:** Scan pages to see 3D characters
- [ ] **Series creator:** Make sequels with same character
- [ ] **Collaborative stories:** Multiple kids add to one story
- [ ] **Templates:** Genre templates (princess, space, dinosaur, etc.)
- [ ] **Voice acting:** Professional voice reads the story
- [ ] **Music:** Generate theme music for the story
- [ ] **Video version:** Animated short based on the book

### B2B Opportunities
- [ ] **School edition:** Teachers create class books
- [ ] **Library programs:** Public library partnerships
- [ ] **Corporate gifts:** Companies sponsor employee family books
- [ ] **Therapy use:** Use for child development/therapy
- [ ] **White label:** License tech to other companies

### Community Features
- [ ] **Gallery:** Share stories (with permission)
- [ ] **Remix:** Other kids can create variations
- [ ] **Competitions:** Monthly theme contests
- [ ] **Author profiles:** Kids build portfolio of stories
- [ ] **Social:** Connect with other young authors

---

## Immediate Next Steps

### This Week
1. [ ] Review and refine this plan with stakeholders
2. [ ] Make final technical stack decisions
3. [ ] Set up development environment (if not done)
4. [ ] Create database schema
5. [ ] Design basic wireframes/mockups
6. [ ] Get API keys for all services
7. [ ] Set up project tracking (GitHub Projects, Linear, etc.)

### Next Week
1. [ ] Begin Phase 1 implementation
2. [ ] Set up analytics and monitoring
3. [ ] Create test plan for audio recording
4. [ ] Research print-on-demand providers
5. [ ] Draft content moderation policy
6. [ ] Plan user testing sessions

---

## Resources & Documentation

### API Documentation
- **OpenAI Whisper:** https://platform.openai.com/docs/guides/speech-to-text
- **Claude API:** https://docs.anthropic.com/
- **Flux.1 (Replicate):** https://replicate.com/black-forest-labs/flux-dev
- **OpenAI Realtime:** https://platform.openai.com/docs/guides/realtime
- **Lulu API:** https://developers.lulu.com/
- **Stripe:** https://stripe.com/docs

### Learning Resources
- **MediaRecorder API:** https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- **FastAPI Tutorial:** https://fastapi.tiangolo.com/tutorial/
- **Next.js Docs:** https://nextjs.org/docs
- **ReportLab Guide:** https://www.reportlab.com/docs/reportlab-userguide.pdf

### Community & Support
- **GitHub Discussions:** (Enable for your repo)
- **Discord:** (Consider creating)
- **Reddit:** r/SideProject for feedback

---

**Last Updated:** February 12, 2026  
**Next Review:** February 19, 2026

*This is a living document. Update as you learn and iterate.*
