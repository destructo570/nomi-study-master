export type SeoToolType =
  | "pdf-summarizer"
  | "flashcards"
  | "video-summarizer"
  | "podcast-generator"
  | "quiz-maker"

export const TOOL_TABS: { type: SeoToolType; label: string; href: string }[] = [
  { type: "pdf-summarizer", label: "PDF", href: "/ai-pdf-summarizer" },
  { type: "video-summarizer", label: "Video", href: "/ai-video-summarizer" },
  { type: "flashcards", label: "Flashcard", href: "/ai-flashcards" },
  { type: "podcast-generator", label: "Podcast", href: "/ai-podcast-generator" },
  { type: "quiz-maker", label: "Quiz", href: "/ai-quiz-maker" },
]

export const PAGE_META: Record<
  SeoToolType,
  { title: string; subtitle: string; inputPlaceholder: string }
> = {
  "pdf-summarizer": {
    title: "AI PDF Summarizer",
    subtitle:
      "Upload any PDF and get concise AI-powered summaries, study notes, flashcards, and more in seconds.",
    inputPlaceholder: "Enter website or PDF URL",
  },
  flashcards: {
    title: "AI Flashcard Generator",
    subtitle:
      "Generate study-ready flashcards from notes, PDFs, videos, and textbooks using AI.",
    inputPlaceholder: "Enter website or video URL",
  },
  "video-summarizer": {
    title: "AI Video Summarizer",
    subtitle:
      "Summarize lectures, YouTube videos, and tutorials into concise notes and study materials.",
    inputPlaceholder: "Enter video URL",
  },
  "podcast-generator": {
    title: "AI Podcast Generator",
    subtitle:
      "Turn notes, PDFs, and study materials into audio podcasts you can listen to anywhere.",
    inputPlaceholder: "Enter website or video URL",
  },
  "quiz-maker": {
    title: "AI Quiz Maker",
    subtitle:
      "Generate practice quizzes, MCQs, and tests from your notes, PDFs, and videos automatically.",
    inputPlaceholder: "Enter website or video URL",
  },
}

export const FEATURE_CARDS: Record<
  SeoToolType,
  { title: string; description: string }[]
> = {
  "pdf-summarizer": [
    {
      title: "Summarize PDFs in Seconds",
      description:
        "Upload textbooks, research papers, lecture notes, and reports to generate concise AI-powered summaries that highlight the most important information.",
    },
    {
      title: "Chat With Your PDF",
      description:
        "Ask questions about your document and get instant answers. Find definitions, explanations, and key concepts without manually searching through pages.",
    },
    {
      title: "Create Study Notes From PDFs",
      description:
        "Transform lengthy documents into organized study notes that are easier to review before exams, assignments, and presentations.",
    },
    {
      title: "Generate Flashcards From PDFs",
      description:
        "Convert important concepts, formulas, definitions, and facts into flashcards designed for active recall learning.",
    },
    {
      title: "Create Quizzes From Any PDF",
      description:
        "Automatically generate practice questions and quizzes from uploaded PDFs to test your understanding and improve retention.",
    },
    {
      title: "Turn PDFs Into Audio Podcasts",
      description:
        "Convert study materials into podcast-style audio so you can learn while commuting, exercising, or multitasking.",
    },
  ],
  flashcards: [
    {
      title: "Generate Flashcards From Notes",
      description:
        "Upload lecture notes, textbooks, and study guides to instantly create AI-powered flashcards for faster revision.",
    },
    {
      title: "Create Flashcards From PDFs",
      description:
        "Automatically extract key concepts from PDF documents and convert them into question-and-answer flashcards.",
    },
    {
      title: "Learn With Active Recall",
      description:
        "Practice important concepts using flashcards designed around active recall, one of the most effective learning techniques.",
    },
    {
      title: "Generate Flashcards From Videos",
      description:
        "Upload lecture recordings or educational videos and transform important information into study-ready flashcards.",
    },
    {
      title: "Create Subject-Specific Flashcards",
      description:
        "Generate flashcards for biology, medicine, engineering, law, computer science, and virtually any academic subject.",
    },
    {
      title: "Study Smarter With AI",
      description:
        "Spend less time creating flashcards manually and more time reviewing the concepts that matter most.",
    },
  ],
  "video-summarizer": [
    {
      title: "Summarize Educational Videos",
      description:
        "Convert lengthy lectures, tutorials, and educational content into concise summaries that save hours of study time.",
    },
    {
      title: "Summarize YouTube Videos",
      description:
        "Extract key insights from YouTube videos and generate structured notes in seconds.",
    },
    {
      title: "Generate Notes From Video Lectures",
      description:
        "Automatically create study notes from online classes, webinars, and recorded lectures.",
    },
    {
      title: "Create Flashcards From Videos",
      description:
        "Transform important concepts discussed in videos into flashcards for exam preparation.",
    },
    {
      title: "Generate Quizzes From Videos",
      description:
        "Test your understanding by automatically generating quiz questions from video content.",
    },
    {
      title: "Learn Faster With AI Summaries",
      description:
        "Focus on key takeaways without spending hours watching entire videos repeatedly.",
    },
  ],
  "podcast-generator": [
    {
      title: "Convert Notes Into Podcasts",
      description:
        "Transform study notes, articles, and PDFs into audio content you can listen to anywhere.",
    },
    {
      title: "Learn While On The Go",
      description:
        "Review study material during commutes, workouts, or daily activities through AI-generated podcasts.",
    },
    {
      title: "Turn PDFs Into Audio Lessons",
      description:
        "Convert textbooks, research papers, and study guides into engaging podcast-style explanations.",
    },
    {
      title: "Create Educational Podcasts Instantly",
      description:
        "Generate structured learning content from your notes without recording or editing audio.",
    },
    {
      title: "Listen Instead Of Reading",
      description:
        "Absorb information through audio when you don't have time to sit down and read long documents.",
    },
    {
      title: "Make Learning More Accessible",
      description:
        "Turn written content into spoken explanations that fit your preferred learning style.",
    },
  ],
  "quiz-maker": [
    {
      title: "Generate Quizzes From Notes",
      description:
        "Create practice quizzes from lecture notes, study guides, and textbooks in seconds.",
    },
    {
      title: "Create Multiple Choice Questions",
      description:
        "Automatically generate MCQs that test understanding of key concepts and definitions.",
    },
    {
      title: "Generate Practice Tests From PDFs",
      description:
        "Convert PDF documents into exam-style assessments for more effective revision.",
    },
    {
      title: "Create Quizzes From Videos",
      description:
        "Generate questions directly from lectures, webinars, and educational videos.",
    },
    {
      title: "Get Instant Answer Explanations",
      description:
        "Learn why answers are correct with AI-generated explanations for every question.",
    },
    {
      title: "Improve Exam Performance",
      description:
        "Use AI-generated quizzes to identify knowledge gaps and strengthen understanding before exams.",
    },
  ],
}

export const FAQ_ITEMS: Record<SeoToolType, { q: string; a: string }[]> = {
  flashcards: [
    {
      q: "How can I create flashcards from my notes using AI?",
      a: "Upload your notes, PDF, lecture slides, or study materials and AI automatically identifies key concepts, definitions, formulas, and important facts to generate flashcards for active recall learning.",
    },
    {
      q: "Can AI generate flashcards from PDF documents?",
      a: "Yes. AI can analyze PDFs, textbooks, research papers, lecture notes, and study guides to create flashcards without manually copying information.",
    },
    {
      q: "What is the best AI flashcard generator for students?",
      a: "The best AI flashcard generators automatically extract important concepts, generate question-answer pairs, support spaced repetition, and allow students to edit cards before studying.",
    },
    {
      q: "Can I convert lecture notes into flashcards automatically?",
      a: "Yes. AI can transform lecture notes into organized flashcards in seconds, helping students review material more efficiently than creating cards manually.",
    },
    {
      q: "Are AI-generated flashcards accurate?",
      a: "AI-generated flashcards are generally accurate when created from high-quality source materials. Reviewing generated cards before studying is always recommended.",
    },
    {
      q: "Can AI flashcards help with exam preparation?",
      a: "Yes. AI flashcards improve retention through active recall and repeated review, making them useful for exams, certifications, university courses, and competitive tests.",
    },
    {
      q: "Can I create flashcards from research papers?",
      a: "Yes. AI can extract key findings, definitions, methodologies, and concepts from research papers and convert them into study-ready flashcards.",
    },
    {
      q: "How are AI flashcards different from traditional flashcards?",
      a: "Traditional flashcards require manual creation, while AI flashcards automatically generate questions and answers from uploaded content, saving significant study time.",
    },
    {
      q: "Can I generate flashcards from YouTube videos?",
      a: "Yes. If video transcripts are available, AI can analyze the content and generate flashcards covering key concepts discussed in the video.",
    },
    {
      q: "Does AI support spaced repetition flashcards?",
      a: "Many AI flashcard tools integrate spaced repetition systems that schedule reviews based on memory strength to maximize long-term retention.",
    },
  ],
  "pdf-summarizer": [
    {
      q: "How can I summarize a PDF using AI?",
      a: "Upload a PDF and AI automatically extracts the text, identifies important information, and generates concise summaries highlighting key points.",
    },
    {
      q: "Can AI summarize large PDF files?",
      a: "Yes. AI can summarize lengthy PDFs including textbooks, research papers, reports, whitepapers, and business documents.",
    },
    {
      q: "What is the best AI PDF summarizer for students?",
      a: "A good AI PDF summarizer should generate accurate summaries, highlight important concepts, support long documents, and provide study-friendly outputs.",
    },
    {
      q: "Can AI summarize academic research papers?",
      a: "Yes. AI can identify research objectives, methodology, findings, conclusions, and key insights from academic papers.",
    },
    {
      q: "Does AI summarize PDFs chapter by chapter?",
      a: "Many AI summarizers can provide section-level summaries, helping readers understand large documents without reading every page.",
    },
    {
      q: "Can AI summarize textbooks?",
      a: "Yes. AI can condense textbook chapters into shorter explanations while preserving important concepts, formulas, and definitions.",
    },
    {
      q: "How accurate are AI PDF summaries?",
      a: "Accuracy depends on document quality and complexity. Modern AI models typically capture the most important information effectively.",
    },
    {
      q: "Can I summarize scanned PDFs?",
      a: "If OCR is supported, AI can extract text from scanned PDFs and generate summaries from the recognized content.",
    },
    {
      q: "Can AI summarize legal documents and contracts?",
      a: "AI can provide high-level summaries of contracts and legal documents, but professional legal review should always be used for critical decisions.",
    },
    {
      q: "Is AI PDF summarization useful for studying?",
      a: "Yes. Students can quickly understand key concepts, reduce reading time, and focus on the most important material before exams.",
    },
  ],
  "video-summarizer": [
    {
      q: "How can I summarize a YouTube video with AI?",
      a: "AI analyzes video transcripts and generates summaries covering the most important topics, ideas, and takeaways discussed in the video.",
    },
    {
      q: "Can AI summarize long educational videos?",
      a: "Yes. AI can summarize lectures, tutorials, webinars, conferences, and online courses, reducing hours of content into minutes of reading.",
    },
    {
      q: "What is the best AI video summarizer for students?",
      a: "The best AI video summarizers generate accurate summaries, key takeaways, timestamps, study notes, and learning materials.",
    },
    {
      q: "Can AI summarize online lectures?",
      a: "Yes. Students can upload lecture recordings or videos and receive structured summaries of important concepts.",
    },
    {
      q: "How does AI extract key points from videos?",
      a: "AI analyzes transcripts, identifies important topics, detects recurring themes, and creates concise summaries.",
    },
    {
      q: "Can AI create study notes from videos?",
      a: "Yes. AI can convert video content into notes, summaries, flashcards, quizzes, and revision materials.",
    },
    {
      q: "Can I summarize video courses automatically?",
      a: "Yes. AI can generate summaries for entire course modules, helping learners review content faster.",
    },
    {
      q: "Does AI work with educational YouTube channels?",
      a: "Yes. AI can summarize educational content from science, mathematics, engineering, business, language learning, and other subjects.",
    },
    {
      q: "Can AI summarize webinars and meetings?",
      a: "Yes. AI can extract discussion points, action items, conclusions, and important insights from recorded sessions.",
    },
    {
      q: "Is AI video summarization accurate?",
      a: "Accuracy depends on transcript quality, but modern AI models generally provide highly useful summaries for educational and professional content.",
    },
  ],
  "podcast-generator": [
    {
      q: "How can I turn my notes into a podcast using AI?",
      a: "Upload notes, articles, PDFs, or study materials and AI converts them into natural audio podcasts for listening on the go.",
    },
    {
      q: "Can AI create podcasts from PDFs?",
      a: "Yes. AI can analyze PDF content and generate podcast-style audio that explains the material in a conversational format.",
    },
    {
      q: "What is an AI podcast generator?",
      a: "An AI podcast generator automatically transforms written content into spoken audio using text-to-speech technology and AI-generated scripts.",
    },
    {
      q: "Can AI generate educational podcasts?",
      a: "Yes. Students and educators can convert study materials into educational podcasts for passive learning and revision.",
    },
    {
      q: "Can I create a podcast from research papers?",
      a: "Yes. AI can simplify complex research papers and convert them into more accessible audio explanations.",
    },
    {
      q: "How does AI convert text into podcasts?",
      a: "AI extracts key information, organizes content into a narrative structure, and generates realistic speech using advanced voice synthesis.",
    },
    {
      q: "Can AI generate podcasts from YouTube videos?",
      a: "Yes. AI can use video transcripts and summaries to create podcast-style audio versions of video content.",
    },
    {
      q: "What are the benefits of AI-generated podcasts for studying?",
      a: "Students can review material while commuting, exercising, or multitasking, making learning more flexible and accessible.",
    },
    {
      q: "Can AI create multi-speaker podcasts?",
      a: "Many AI podcast generators support multiple AI voices to simulate realistic conversations and discussions.",
    },
    {
      q: "Is AI podcast generation useful for content creators?",
      a: "Yes. Content creators can quickly repurpose articles, blogs, videos, and newsletters into audio content.",
    },
  ],
  "quiz-maker": [
    {
      q: "How can I create quizzes automatically using AI?",
      a: "Upload study materials, notes, PDFs, or videos and AI generates quiz questions based on the content.",
    },
    {
      q: "Can AI create multiple-choice questions from PDFs?",
      a: "Yes. AI can generate multiple-choice questions, true-or-false questions, short-answer questions, and other quiz formats.",
    },
    {
      q: "What is the best AI quiz generator for students?",
      a: "The best AI quiz generators create accurate questions, provide explanations, support multiple formats, and adapt to learning goals.",
    },
    {
      q: "Can AI generate quizzes from lecture notes?",
      a: "Yes. AI can analyze lecture notes and generate quizzes that test understanding of important concepts.",
    },
    {
      q: "Can AI create practice tests for exams?",
      a: "Yes. AI can generate practice exams, mock tests, and revision quizzes from study materials.",
    },
    {
      q: "How accurate are AI-generated quiz questions?",
      a: "When based on reliable source content, AI-generated quizzes are generally accurate and effective for learning.",
    },
    {
      q: "Can AI generate quizzes from YouTube videos?",
      a: "Yes. AI can analyze transcripts and create quiz questions covering important concepts discussed in the video.",
    },
    {
      q: "Can teachers use AI to create classroom assessments?",
      a: "Yes. Educators can quickly generate quizzes, homework assignments, and review questions from teaching materials.",
    },
    {
      q: "Does AI generate answer explanations?",
      a: "Many AI quiz generators provide explanations alongside answers to help students understand mistakes.",
    },
    {
      q: "Can AI quizzes improve learning outcomes?",
      a: "Yes. Regular self-testing is one of the most effective evidence-based learning techniques for improving retention and understanding.",
    },
  ],
}

export const PEOPLE_ALSO_ASK: Record<SeoToolType, { q: string; a: string }[]> = {
  flashcards: [
    {
      q: "What is an AI flashcard generator?",
      a: "An AI flashcard generator automatically creates study flashcards from notes, PDFs, textbooks, videos, and other learning materials. Instead of manually writing cards, AI identifies important concepts and turns them into question-and-answer flashcards.",
    },
    {
      q: "How can I create flashcards from notes using AI?",
      a: "Upload your notes and AI will analyze the content, extract key concepts, and generate flashcards that help reinforce learning through active recall.",
    },
    {
      q: "Can AI generate flashcards from PDF files?",
      a: "Yes. AI can analyze PDF documents, lecture notes, textbooks, and research papers to automatically create study flashcards.",
    },
    {
      q: "What is the best AI flashcard generator for students?",
      a: "The best AI flashcard generator should create accurate flashcards, support multiple file types, and help students review material efficiently through active recall.",
    },
    {
      q: "Can AI create Anki-style flashcards?",
      a: "Yes. AI-generated flashcards follow a similar question-and-answer format commonly used in spaced repetition systems like Anki.",
    },
    {
      q: "Can AI generate flashcards from YouTube videos?",
      a: "Yes. AI can analyze video transcripts and convert key concepts into study flashcards.",
    },
    {
      q: "Are AI-generated flashcards accurate?",
      a: "AI-generated flashcards are generally accurate when created from reliable source material. Students can review and edit cards before studying.",
    },
    {
      q: "Can AI create flashcards from textbooks?",
      a: "Yes. AI can extract definitions, formulas, facts, and concepts from textbooks and convert them into flashcards.",
    },
    {
      q: "How long does it take to generate flashcards with AI?",
      a: "Most flashcard generators can create dozens of flashcards within seconds after processing the uploaded material.",
    },
    {
      q: "Are AI flashcards useful for exam preparation?",
      a: "Yes. Flashcards support active recall, one of the most effective learning techniques for improving memory retention before exams.",
    },
  ],
  "pdf-summarizer": [
    {
      q: "What is an AI PDF summarizer?",
      a: "An AI PDF summarizer analyzes documents and generates concise summaries that highlight important information, helping users understand content faster.",
    },
    {
      q: "Can AI summarize a PDF automatically?",
      a: "Yes. Upload a PDF and AI can generate a summary without requiring manual reading of the entire document.",
    },
    {
      q: "What is the best AI PDF summarizer?",
      a: "The best AI PDF summarizer should accurately identify key ideas, support large documents, and provide structured summaries.",
    },
    {
      q: "Can ChatGPT summarize PDFs?",
      a: "Yes. AI tools can analyze PDF content and generate summaries, explanations, and study notes.",
    },
    {
      q: "Can AI summarize research papers?",
      a: "Yes. AI can identify objectives, methodology, findings, and conclusions from academic papers.",
    },
    {
      q: "Can AI summarize textbooks?",
      a: "Yes. AI can summarize chapters, concepts, and important sections from textbooks.",
    },
    {
      q: "How accurate are AI PDF summaries?",
      a: "Modern AI models are highly effective at extracting key information from most documents.",
    },
    {
      q: "Can AI summarize scanned PDFs?",
      a: "If text can be extracted through OCR, AI can summarize scanned documents as well.",
    },
    {
      q: "Is there a free AI PDF summarizer?",
      a: "Many AI PDF summarizers offer free plans with limited document processing.",
    },
    {
      q: "How do I summarize a long PDF quickly?",
      a: "Upload the document and AI can generate a summary within seconds or minutes depending on document size.",
    },
  ],
  "video-summarizer": [
    {
      q: "What is an AI video summarizer?",
      a: "An AI video summarizer extracts key points from videos and generates concise summaries.",
    },
    {
      q: "Can AI summarize YouTube videos?",
      a: "Yes. AI can analyze transcripts and summarize educational, business, and informational videos.",
    },
    {
      q: "How do I summarize a video automatically?",
      a: "Upload a video or provide a supported video source and AI will generate a summary.",
    },
    {
      q: "Can AI generate notes from videos?",
      a: "Yes. AI can create structured notes and study materials from video content.",
    },
    {
      q: "What is the best AI video summarizer?",
      a: "The best AI video summarizers provide accurate summaries, notes, and learning materials.",
    },
    {
      q: "Can AI summarize online courses?",
      a: "Yes. AI can summarize course modules and educational lectures.",
    },
    {
      q: "Can AI summarize webinars?",
      a: "Yes. AI can extract key insights and discussion points from webinars.",
    },
    {
      q: "Can AI summarize lecture recordings?",
      a: "Yes. AI is commonly used by students to summarize lectures.",
    },
    {
      q: "How accurate are AI video summaries?",
      a: "Accuracy depends on transcript quality, but modern AI systems perform well on most educational content.",
    },
    {
      q: "Is there a free AI video summarizer?",
      a: "Many AI summarizers offer free usage limits for basic summarization.",
    },
  ],
  "podcast-generator": [
    {
      q: "What is an AI podcast generator?",
      a: "An AI podcast generator converts written content into spoken audio using artificial intelligence.",
    },
    {
      q: "Can AI create podcasts from text?",
      a: "Yes. AI can transform notes, PDFs, articles, and study materials into podcast-style audio.",
    },
    {
      q: "How do I convert notes into a podcast?",
      a: "Upload your notes and AI will generate an audio version that can be listened to anywhere.",
    },
    {
      q: "Can AI create educational podcasts?",
      a: "Yes. Educational content is one of the most popular uses of AI podcast generation.",
    },
    {
      q: "Can AI create podcasts from PDFs?",
      a: "Yes. AI can convert PDF content into narrated podcast episodes.",
    },
    {
      q: "What is the best AI podcast generator?",
      a: "The best AI podcast generators create natural-sounding audio and support various content formats.",
    },
    {
      q: "Can AI generate multiple speakers?",
      a: "Some AI podcast generators support conversations between multiple AI voices.",
    },
    {
      q: "Is AI podcast generation useful for studying?",
      a: "Yes. Students can listen to learning material while commuting or exercising.",
    },
    {
      q: "Can AI convert research papers into audio?",
      a: "Yes. AI can transform research papers into easier-to-consume audio content.",
    },
    {
      q: "Is there a free AI podcast generator?",
      a: "Many tools provide free plans with limited audio generation.",
    },
  ],
  "quiz-maker": [
    {
      q: "What is an AI quiz maker?",
      a: "An AI quiz maker automatically generates quiz questions from study materials, notes, PDFs, and videos.",
    },
    {
      q: "Can AI generate quiz questions?",
      a: "Yes. AI can create multiple-choice, true-or-false, and short-answer questions.",
    },
    {
      q: "Can AI generate quizzes from PDFs?",
      a: "Yes. AI can analyze PDF content and create quizzes automatically.",
    },
    {
      q: "How do I create a quiz using AI?",
      a: "Upload study material and AI generates questions based on the content.",
    },
    {
      q: "What is the best AI quiz generator?",
      a: "The best AI quiz generators create accurate questions with explanations.",
    },
    {
      q: "Can AI create practice tests?",
      a: "Yes. AI can generate practice exams and review quizzes.",
    },
    {
      q: "Can AI generate multiple-choice questions?",
      a: "Yes. Multiple-choice question generation is one of the most common use cases.",
    },
    {
      q: "Can teachers use AI quiz makers?",
      a: "Yes. Educators use AI to create assessments and classroom activities.",
    },
    {
      q: "Are AI-generated quizzes accurate?",
      a: "AI-generated quizzes are generally accurate when based on reliable source material.",
    },
    {
      q: "Is there a free AI quiz generator?",
      a: "Many quiz generators provide free plans with limited usage.",
    },
  ],
}
