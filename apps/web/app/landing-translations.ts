export const LANGUAGES = [
  { code: "en", label: "EN", name: "English", flag: "🇺🇸" },
  { code: "it", label: "IT", name: "Italiano", flag: "🇮🇹" },
  { code: "de", label: "DE", name: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "ES", name: "Español", flag: "🇪🇸" },
  { code: "tr", label: "TR", name: "Türkçe", flag: "🇹🇷" },
] as const

export type Lang = (typeof LANGUAGES)[number]["code"]

export type Dictionary = {
  nav: { features: string; pricing: string; blog: string; tryFree: string }
  hero: {
    title1: string
    title2: string
    titleItalic: string
    subtitle: string
    seeFeatures: string
    getStarted: string
  }
  trust: { label: string }
  quizlet: { title: string; body: string; bullets: [string, string, string] }
  features: {
    heading: string
    items: { title: string; body: string }[]
  }
  testimonials: { role: string; headline: string; quote: string }[]
  faq: {
    heading: string
    intro: string
    items: { q: string; a: string }[]
  }
  pricing: {
    eyebrow: string
    heading: string
    subhead: string
    footnote: string
    cta: string
  }
  cta: { heading: string; body: string; button: string }
  footer: {
    tagline: string
    cols: { title: string; items: string[] }[]
    copyright: string
    madeIn: string
  }
}

export const TRANSLATIONS: Record<Lang, Dictionary> = {
  en: {
    nav: { features: "Features", pricing: "Pricing", blog: "Blog", tryFree: "Try for free" },
    hero: {
      title1: "The Only AI Study Tool",
      title2: "you need to ace 🚀",
      titleItalic: "any exam.",
      subtitle:
        "Transform your study materials into notes, quizzes, flashcards, podcasts, and more.",
      seeFeatures: "See features",
      getStarted: "Start Studying for Free",
    },
    trust: { label: "Trusted by top students from" },
    quizlet: {
      title: "The Best Quizlet Alternative with AI Study Tools",
      body: "The #1 Quizlet Alternative with AI Study Tools. Picking the perfect AI study tool can be tough, so we built everything in one app!",
      bullets: [
        "Drop in any document and let our PDF Summarizer turn it into notes, flashcards, and quizzes",
        "Paste a link or pick a clip and our YouTube Video Summarizer pulls out the key ideas",
        "Hit record in class and our AI Lecture Summarizer writes the notes for you",
      ],
    },
    features: {
      heading: "Everything you need in one place.",
      items: [
        {
          title: "AI Flashcard Maker",
          body: "Turn any study material into spaced repetition flashcards designed for long-term retention.",
        },
        {
          title: "AI Tutor",
          body: "Get personalized explanations and instant answers from an AI tutor that understands your study material.",
        },
        {
          title: "AI Quiz Generator",
          body: "Identify knowledge gaps and strengthen your understanding with AI-generated quizzes.",
        },
        {
          title: "AI Podcast Generator",
          body: "Transform any content into an AI podcast and learn on the go.",
        },
        {
          title: "Visual Mind Maps from Any Source",
          body: "Break down complex subjects into connected ideas you can actually understand.",
        },
        {
          title: "AI Lecture Note Taker",
          body: "Focus on the lecture while AI captures and organizes the important points for you.",
        },
        {
          title: "Switch Between Tutor Personas to Match How You Learn",
          body: "Pick a Socratic tutor, an exam coach, or a friendly explainer - each persona adapts its tone, depth, and pacing to the way you study best.",
        },
        {
          title: "Learn in Your Native Language",
          body: "Learn from any study material in your preferred language-no translation required.",
        },
        {
          title: "AI Study Planner",
          body: "Generate a personalized study schedule tailored to your exams and goals.",
        },
      ],
    },
    testimonials: [
      {
        role: "Gaokao aspirant",
        headline: "Better flashcards than I'd ever make",
        quote:
          "Dumped my entire inorganic chem folder into it at 2am and somehow walked into the exam not feeling cooked. The flashcards were actually better than the ones I spent hours making myself.",
      },
      {
        role: "CS student, University of Toronto",
        headline: "No more rewatching 2 hour recordings",
        quote:
          "The lecture summary thing is lowkey insane. I stopped rewatching 2 hour recordings because it pulls out the exact stuff professors hide in between random tangents.",
      },
      {
        role: "Student",
        headline: "All my notes finally talk to each other",
        quote:
          "I had notes scattered across Notion, random PDFs, Telegram and Google Docs. Now I just throw everything here and the AI actually remembers my material when I ask questions.",
      },
      {
        role: "Student",
        headline: "Brutal in a good way",
        quote:
          "The quizzes are brutal in a good way. It keeps targeting the chapters I keep messing up instead of giving me easy confidence boost questions.",
      },
      {
        role: "High school senior, Shanghai",
        headline: "Saved my Gaokao prep",
        quote:
          "Recorded my coaching class during the metro ride home, got revision notes before dinner. Genuinely saved my Gaokao prep.",
      },
      {
        role: "Student",
        headline: "Like that smart friend who explains",
        quote:
          "Feels less like an app and more like that smart friend who explains concepts without making you feel dumb. The tutor catches gaps in my reasoning instantly.",
      },
      {
        role: "Pre-med student, UCLA",
        headline: "Wish I'd found it earlier",
        quote:
          "I used it for one week before finals and immediately regretted not finding it earlier. The AI tutor explaining stuff from my own notes changed everything.",
      },
      {
        role: "Computer science student",
        headline: "The ADHD mode is underrated",
        quote:
          "The ADHD mode is underrated. Breaking long chapters into tiny lessons + quizzes made studying feel way less exhausting.",
      },
    ],
    faq: {
      heading: "Frequently asked questions",
      intro:
        "Everything you need to know about nomi - the AI study tool that turns any source into flashcards, quizzes, notes, and a tutor.",
      items: [
        {
          q: "What is nomi and how does it work as an AI study tool?",
          a: "nomi is an all-in-one AI study platform that turns your PDFs, lecture recordings, YouTube videos, and notes into flashcards, quizzes, summaries, mind maps, and a tutor that can answer questions grounded in your own material.",
        },
        {
          q: "Is nomi a free Quizlet alternative?",
          a: "Yes. nomi offers a free plan with AI flashcards, quizzes, and summaries from your own study material - plus a tutor that actually understands your content, which Quizlet does not.",
        },
        {
          q: "Can the AI Flashcard Generator create cards from PDFs and YouTube videos?",
          a: "Absolutely. Upload a PDF, paste a YouTube URL, or drop in lecture notes and nomi's AI Flashcard Generator produces spaced-repetition flashcards in seconds.",
        },
        {
          q: "How does the AI Lecture Summarizer work?",
          a: "Record a class directly inside nomi or upload an audio file. The AI Lecture Summarizer transcribes it, extracts key concepts, and produces concise notes and a summary you can revise from.",
        },
        {
          q: "Can I generate quizzes and practice tests automatically?",
          a: "Yes. nomi auto-generates multiple-choice quizzes, practice tests, and revision questions from any source you upload, so you can self-test without writing a single question by hand.",
        },
        {
          q: "Does the AI Tutor actually understand my study material?",
          a: "The tutor is grounded on the documents, videos, and notes you upload, so it cites your own material when answering and adapts its depth to your level instead of giving generic ChatGPT-style replies.",
        },
        {
          q: "Is my study material private and secure on nomi?",
          a: "Your uploads are private to your account. We do not sell your data and your content is never used to train public models.",
        },
        {
          q: "What file types and sources does nomi support?",
          a: "nomi supports PDFs, Word docs, slides, text notes, audio recordings, YouTube links, and web articles - anything you study from can become a flashcard, quiz, summary, or mind map.",
        },
      ],
    },
    pricing: {
      eyebrow: "",
      heading: "Study smarter and better",
      subhead:
        "Chat without limits. Create podcasts and upload larger files and much more.",
      footnote:
        "Cancel anytime - billing stops at the end of the period.",
      cta: "Select Plan",
    },
    cta: {
      heading: "Join Students using Nomi to study 2× faster",
      body: "Start for free. No card, no commitment.",
      button: "Start Studying for Free",
    },
    footer: {
      tagline:
        "The AI study workspace for people who actually need to remember what they read.",
      cols: [
        // {
        //   title: "Product",
        //   items: [
        //     "AI Flashcards",
        //     "AI PDF Summarizer",
        //     "AI PPT Summarizer",
        //     "AI Video Summarizer",
        //     "AI Lecture Note Taker",
        //     "AI Article Summarizer",
        //     "AI Notes Summarizer",
        //     "AI Quiz Generator",
        //     "AI Mind Map Maker",
        //     "AI Tutor Chat",
        //     "AI Podcast Maker",
        //     "AI Study Guide",
        //   ],
        // },
        // {
        //   title: "Use cases",
        //   items: [
        //     "MCAT & USMLE",
        //     "Law school",
        //     "Engineering",
        //     "Self-study",
        //     "Researchers",
        //     "Teachers",
        //   ],
        // },
        {
          title: "Resources",
          items: ["Pricing", "Blog", "Community"],
        },
        {
          title: "Company",
          items: ["Privacy", "Terms", "Contact"],
        },
      ],
      copyright: "All rights reserved.",
      madeIn: "Built for learners.",
    },
  },

  it: {
    nav: { features: "Funzionalità", pricing: "Prezzi", blog: "Blog", tryFree: "Prova gratis" },
    hero: {
      title1: "L'unico strumento di studio AI",
      title2: "di cui hai bisogno per imparare",
      titleItalic: "qualsiasi cosa.",
      subtitle:
        "Trasforma i tuoi materiali di studio in appunti, quiz, flashcard, chat interattive e altro ancora.",
      seeFeatures: "Scopri le funzionalità",
      getStarted: "Inizia a studiare gratis",
    },
    trust: { label: "Scelto dai migliori studenti di" },
    quizlet: {
      title: "La migliore alternativa a Quizlet con strumenti di studio AI",
      body: "L'alternativa #1 a Quizlet con strumenti di studio AI. Scegliere lo strumento perfetto può essere difficile, così abbiamo costruito tutto in un'unica app!",
      bullets: [
        "Carica qualsiasi documento e lascia che il nostro Riassuntore PDF lo trasformi in appunti, flashcard e quiz",
        "Incolla un link o scegli una clip e il nostro Riassuntore di video YouTube estrae le idee chiave",
        "Premi registra in aula e il nostro Riassuntore di lezioni AI scrive gli appunti per te",
      ],
    },
    features: {
      heading: "Tutto ciò di cui hai bisogno, in un solo posto.",
      items: [
        {
          title: "Generatore di flashcard AI",
          body: "Trasforma qualsiasi materiale di studio in flashcard a ripetizione spaziata pensate per il ricordo a lungo termine.",
        },
        {
          title: "Tutor AI",
          body: "Ricevi spiegazioni personalizzate e risposte istantanee da un tutor AI che capisce i tuoi materiali di studio.",
        },
        {
          title: "Generatore di quiz AI",
          body: "Individua le lacune e rafforza la tua comprensione con quiz generati dall'AI.",
        },
        {
          title: "Generatore di podcast AI",
          body: "Trasforma qualsiasi contenuto in un podcast AI e studia ovunque tu sia.",
        },
        {
          title: "Mappe mentali visive da qualsiasi fonte",
          body: "Scomponi argomenti complessi in idee collegate che puoi capire davvero.",
        },
        {
          title: "Appunti di lezione con AI",
          body: "Concentrati sulla lezione mentre l'AI cattura e organizza per te i punti importanti.",
        },
        {
          title: "Cambia personalità del tutor in base al tuo stile",
          body: "Scegli un tutor socratico, un coach d'esame o un esplicativo amichevole: ogni personalità adatta tono, profondità e ritmo al tuo modo di studiare.",
        },
        {
          title: "Studia nella tua lingua madre",
          body: "Studia da qualsiasi materiale nella lingua che preferisci, senza bisogno di traduzioni.",
        },
        {
          title: "Pianificatore di studio AI",
          body: "Genera un piano di studio personalizzato in base ai tuoi esami e obiettivi.",
        },
      ],
    },
    testimonials: [
      {
        role: "Aspirante Gaokao",
        headline: "Flashcard migliori di quelle che faccio io",
        quote:
          "Ho buttato dentro tutta la cartella di chimica inorganica alle 2 di notte e sono entrata all'esame senza sentirmi distrutta. Le flashcard erano davvero migliori di quelle che mi facevo a mano per ore.",
      },
      {
        role: "Studente di informatica, Università di Toronto",
        headline: "Basta registrazioni da 2 ore",
        quote:
          "Il riassunto delle lezioni è una cosa folle. Ho smesso di riguardare registrazioni da 2 ore perché tira fuori esattamente ciò che i prof nascondono tra le divagazioni.",
      },
      {
        role: "Studente",
        headline: "Finalmente i miei appunti si parlano",
        quote:
          "Avevo appunti sparsi tra Notion, PDF a caso, Telegram e Google Docs. Ora butto tutto qui e l'AI si ricorda davvero del mio materiale quando faccio domande.",
      },
      {
        role: "Studentessa",
        headline: "Brutali nel modo giusto",
        quote:
          "I quiz sono brutali nel modo giusto. Continua a colpire i capitoli su cui sbaglio invece di darmi domande facili per farmi sentire brava.",
      },
      {
        role: "Studente liceale, Shanghai",
        headline: "Mi ha salvato il Gaokao",
        quote:
          "Ho registrato la lezione di ripetizione mentre tornavo in metro, avevo gli appunti di ripasso prima di cena. Mi ha davvero salvato la preparazione al Gaokao.",
      },
      {
        role: "Studente",
        headline: "Come quell'amico intelligente che spiega",
        quote:
          "Sembra meno un'app e più quell'amico intelligente che ti spiega le cose senza farti sentire stupido. Il tutor coglie subito i buchi nel mio ragionamento.",
      },
      {
        role: "Studentessa pre-med, UCLA",
        headline: "Vorrei averlo trovato prima",
        quote:
          "L'ho usato per una settimana prima della sessione e mi sono pentita subito di non averlo scoperto prima. L'AI che spiega le cose partendo dai miei appunti ha cambiato tutto.",
      },
      {
        role: "Studente di informatica",
        headline: "La modalità ADHD è sottovalutata",
        quote:
          "La modalità ADHD è sottovalutata. Spezzare i capitoli lunghi in mini-lezioni e quiz ha reso lo studio molto meno faticoso.",
      },
    ],
    faq: {
      heading: "Domande frequenti",
      intro:
        "Tutto quello che devi sapere su nomi: lo strumento di studio AI che trasforma qualsiasi fonte in flashcard, quiz, appunti e un tutor.",
      items: [
        {
          q: "Cos'è nomi e come funziona come strumento di studio AI?",
          a: "nomi è una piattaforma di studio AI tutto-in-uno che trasforma i tuoi PDF, registrazioni di lezioni, video YouTube e appunti in flashcard, quiz, riassunti, mappe mentali e un tutor in grado di rispondere alle domande basandosi sul tuo materiale.",
        },
        {
          q: "nomi è un'alternativa gratuita a Quizlet?",
          a: "Sì. nomi offre un piano gratuito con flashcard AI, quiz e riassunti basati sul tuo materiale, più un tutor che capisce davvero i tuoi contenuti, cosa che Quizlet non fa.",
        },
        {
          q: "Il generatore di flashcard AI funziona con PDF e video YouTube?",
          a: "Assolutamente sì. Carica un PDF, incolla un URL di YouTube o aggiungi i tuoi appunti e il generatore di flashcard AI di nomi crea flashcard a ripetizione spaziata in pochi secondi.",
        },
        {
          q: "Come funziona il riassuntore di lezioni AI?",
          a: "Registra una lezione direttamente in nomi o carica un file audio. Il riassuntore di lezioni AI la trascrive, estrae i concetti chiave e produce appunti concisi e un riassunto su cui ripassare.",
        },
        {
          q: "Posso generare quiz e test di pratica automaticamente?",
          a: "Sì. nomi genera automaticamente quiz a scelta multipla, test di pratica e domande di ripasso da qualsiasi fonte tu carichi, così puoi metterti alla prova senza scrivere una sola domanda.",
        },
        {
          q: "Il tutor AI capisce davvero il mio materiale di studio?",
          a: "Il tutor si basa sui documenti, video e appunti che carichi, quindi cita il tuo materiale quando risponde e adatta la profondità al tuo livello invece di dare risposte generiche stile ChatGPT.",
        },
        {
          q: "Il mio materiale di studio è privato e sicuro su nomi?",
          a: "I tuoi caricamenti sono privati e legati al tuo account. Non vendiamo i tuoi dati e i tuoi contenuti non vengono mai usati per addestrare modelli pubblici.",
        },
        {
          q: "Quali tipi di file e fonti supporta nomi?",
          a: "nomi supporta PDF, documenti Word, slide, appunti di testo, registrazioni audio, link YouTube e articoli web: qualsiasi cosa su cui studi può diventare una flashcard, un quiz, un riassunto o una mappa mentale.",
        },
      ],
    },
    pricing: {
      eyebrow: "",
      heading: "Studia in modo più intelligente ed efficace",
      subhead:
        "Chatta senza limiti. Crea podcast e carica file più grandi e molto altro ancora.",
      footnote:
        "Cancella quando vuoi - la fatturazione si ferma alla fine del periodo.",
      cta: "Seleziona piano",
    },
    cta: {
      heading: "Unisciti agli studenti che imparano 2× più velocemente con Nomi",
      body: "Inizia gratis. Niente carta, nessun impegno.",
      button: "Inizia a studiare gratis",
    },
    footer: {
      tagline:
        "Lo spazio di studio AI per chi ha davvero bisogno di ricordare quello che legge.",
      cols: [
        // {
        //   title: "Prodotto",
        //   items: [
        //     "AI Flashcards",
        //     "AI PDF Summarizer",
        //     "AI PPT Summarizer",
        //     "AI Video Summarizer",
        //     "AI Lecture Note Taker",
        //     "AI Article Summarizer",
        //     "AI Notes Summarizer",
        //     "AI Quiz Generator",
        //     "AI Mind Map Maker",
        //     "AI Tutor Chat",
        //     "AI Podcast Maker",
        //     "AI Study Guide",
        //   ],
        // },
        // {
        //   title: "Casi d'uso",
        //   items: [
        //     "MCAT & USMLE",
        //     "Giurisprudenza",
        //     "Ingegneria",
        //     "Studio personale",
        //     "Ricercatori",
        //     "Insegnanti",
        //   ],
        // },
        {
          title: "Risorse",
          items: ["Prezzi", "Blog", "Community"],
        },
        {
          title: "Azienda",
          items: ["Privacy", "Termini", "Contatti"],
        },
      ],
      copyright: "Tutti i diritti riservati.",
      madeIn: "Fatto per chi studia.",
    },
  },

  de: {
    nav: { features: "Funktionen", pricing: "Preise", blog: "Blog", tryFree: "Kostenlos testen" },
    hero: {
      title1: "Das einzige KI-Lerntool,",
      title2: "das du brauchst, um",
      titleItalic: "alles zu lernen.",
      subtitle:
        "Verwandle deine Lernmaterialien in Notizen, Quizze, Karteikarten, interaktive Chats und mehr.",
      seeFeatures: "Funktionen ansehen",
      getStarted: "Kostenlos mit dem Lernen beginnen",
    },
    trust: { label: "Vertraut von Top-Studierenden von" },
    quizlet: {
      title: "Die beste Quizlet-Alternative mit KI-Lerntools",
      body: "Die Nr. 1 Quizlet-Alternative mit KI-Lerntools. Das perfekte KI-Lerntool zu finden ist schwer – also haben wir alles in einer App vereint!",
      bullets: [
        "Lade ein beliebiges Dokument hoch und lass unseren PDF-Zusammenfasser daraus Notizen, Karteikarten und Quizze machen",
        "Füge einen Link ein oder wähle einen Clip und unser YouTube-Video-Zusammenfasser zieht die Kernideen heraus",
        "Drücke im Kurs auf Aufnahme und unser KI-Vorlesungs-Zusammenfasser schreibt die Notizen für dich",
      ],
    },
    features: {
      heading: "Alles, was du brauchst, an einem Ort.",
      items: [
        {
          title: "KI-Karteikarten-Generator",
          body: "Verwandle jedes Lernmaterial in Spaced-Repetition-Karteikarten für langfristiges Behalten.",
        },
        {
          title: "KI-Tutor",
          body: "Erhalte personalisierte Erklärungen und sofortige Antworten von einem KI-Tutor, der dein Lernmaterial versteht.",
        },
        {
          title: "KI-Quiz-Generator",
          body: "Erkenne Wissenslücken und vertiefe dein Verständnis mit KI-generierten Quizzen.",
        },
        {
          title: "KI-Podcast-Generator",
          body: "Verwandle jeden Inhalt in einen KI-Podcast und lerne unterwegs.",
        },
        {
          title: "Visuelle Mindmaps aus jeder Quelle",
          body: "Zerlege komplexe Themen in verbundene Ideen, die du wirklich verstehst.",
        },
        {
          title: "KI-Vorlesungs-Notizen",
          body: "Konzentriere dich auf die Vorlesung, während die KI die wichtigen Punkte für dich festhält und ordnet.",
        },
        {
          title: "Wechsle zwischen Tutor-Personas, passend zu deinem Lernstil",
          body: "Wähle einen sokratischen Tutor, einen Prüfungscoach oder einen freundlichen Erklärer – jede Persona passt Ton, Tiefe und Tempo deinem Lernstil an.",
        },
        {
          title: "Lerne in deiner Muttersprache",
          body: "Lerne aus jedem Material in deiner bevorzugten Sprache – ohne Übersetzung nötig.",
        },
        {
          title: "KI-Lernplaner",
          body: "Erstelle einen personalisierten Lernplan, abgestimmt auf deine Prüfungen und Ziele.",
        },
      ],
    },
    testimonials: [
      {
        role: "Gaokao-Anwärterin",
        headline: "Karteikarten besser als meine eigenen",
        quote:
          "Habe um 2 Uhr nachts den ganzen Anorganik-Ordner reingeworfen und bin irgendwie ohne Panik in die Prüfung gegangen. Die Karteikarten waren wirklich besser als die, die ich mir stundenlang selbst gebastelt hatte.",
      },
      {
        role: "Informatikstudent, University of Toronto",
        headline: "Schluss mit 2-Stunden-Aufnahmen",
        quote:
          "Die Vorlesungs-Zusammenfassung ist Wahnsinn. Ich schaue keine 2-Stunden-Aufnahmen mehr, weil das Tool genau das rausholt, was Profs zwischen zufälligen Tangenten verstecken.",
      },
      {
        role: "Student",
        headline: "Endlich reden meine Notizen miteinander",
        quote:
          "Meine Notizen waren überall verstreut: Notion, zufällige PDFs, Telegram, Google Docs. Jetzt schmeiße ich alles hier rein und die KI merkt sich tatsächlich mein Material, wenn ich nachfrage.",
      },
      {
        role: "Studentin",
        headline: "Brutal – im guten Sinne",
        quote:
          "Die Quizze sind brutal im guten Sinne. Sie zielen ständig auf die Kapitel, in denen ich Mist baue, statt mir einfache Confidence-Boost-Fragen zu geben.",
      },
      {
        role: "Oberstufenschülerin, Shanghai",
        headline: "Hat meine Gaokao-Vorbereitung gerettet",
        quote:
          "Habe meinen Nachhilfeunterricht in der U-Bahn aufgenommen, hatte die Wiederholungs-Notizen vor dem Abendessen. Hat meine Gaokao-Vorbereitung wirklich gerettet.",
      },
      {
        role: "Student",
        headline: "Wie der kluge Freund, der's erklärt",
        quote:
          "Fühlt sich weniger wie eine App an und mehr wie dieser eine kluge Freund, der Konzepte erklärt, ohne dass man sich dumm fühlt. Der Tutor erkennt Lücken in meinem Denken sofort.",
      },
      {
        role: "Pre-Med-Studentin, UCLA",
        headline: "Hätte ich's nur früher gefunden",
        quote:
          "Habe es eine Woche vor den Klausuren benutzt und sofort bereut, es nicht früher gefunden zu haben. Dass die KI Dinge aus meinen eigenen Notizen erklärt, hat alles verändert.",
      },
      {
        role: "Informatikstudent",
        headline: "Der ADHS-Modus ist unterschätzt",
        quote:
          "Der ADHS-Modus ist unterschätzt. Lange Kapitel in winzige Lektionen + Quizze zu zerlegen, hat das Lernen viel weniger anstrengend gemacht.",
      },
    ],
    faq: {
      heading: "Häufig gestellte Fragen",
      intro:
        "Alles, was du über nomi wissen musst – das KI-Lerntool, das jede Quelle in Karteikarten, Quizze, Notizen und einen Tutor verwandelt.",
      items: [
        {
          q: "Was ist nomi und wie funktioniert es als KI-Lerntool?",
          a: "nomi ist eine All-in-one-KI-Lernplattform, die deine PDFs, Vorlesungsaufnahmen, YouTube-Videos und Notizen in Karteikarten, Quizze, Zusammenfassungen, Mindmaps und einen Tutor verwandelt, der Fragen auf Basis deines eigenen Materials beantwortet.",
        },
        {
          q: "Ist nomi eine kostenlose Quizlet-Alternative?",
          a: "Ja. nomi bietet einen kostenlosen Plan mit KI-Karteikarten, Quizzen und Zusammenfassungen aus deinem eigenen Material – plus einen Tutor, der deine Inhalte wirklich versteht, was Quizlet nicht kann.",
        },
        {
          q: "Kann der KI-Karteikarten-Generator Karten aus PDFs und YouTube-Videos erstellen?",
          a: "Absolut. Lade ein PDF hoch, füge eine YouTube-URL ein oder gib deine Vorlesungsnotizen ein, und nomis KI-Karteikarten-Generator erstellt in Sekunden Spaced-Repetition-Karten.",
        },
        {
          q: "Wie funktioniert der KI-Vorlesungs-Zusammenfasser?",
          a: "Nimm eine Vorlesung direkt in nomi auf oder lade eine Audiodatei hoch. Der KI-Vorlesungs-Zusammenfasser transkribiert sie, extrahiert die Kernkonzepte und erzeugt prägnante Notizen sowie eine Zusammenfassung zum Wiederholen.",
        },
        {
          q: "Kann ich Quizze und Übungstests automatisch erzeugen?",
          a: "Ja. nomi erzeugt automatisch Multiple-Choice-Quizze, Übungstests und Wiederholungsfragen aus jeder Quelle, die du hochlädst – ohne eine einzige Frage selbst zu schreiben.",
        },
        {
          q: "Versteht der KI-Tutor mein Lernmaterial wirklich?",
          a: "Der Tutor ist auf die hochgeladenen Dokumente, Videos und Notizen gestützt, zitiert dein eigenes Material in den Antworten und passt die Tiefe an dein Niveau an – statt generischer ChatGPT-Antworten.",
        },
        {
          q: "Sind meine Lernmaterialien auf nomi privat und sicher?",
          a: "Deine Uploads sind privat und an dein Konto gebunden. Wir verkaufen deine Daten nicht und dein Inhalt wird nie zum Training öffentlicher Modelle verwendet.",
        },
        {
          q: "Welche Dateitypen und Quellen unterstützt nomi?",
          a: "nomi unterstützt PDFs, Word-Dokumente, Folien, Textnotizen, Audioaufnahmen, YouTube-Links und Webartikel – alles, womit du lernst, kann zu einer Karteikarte, einem Quiz, einer Zusammenfassung oder einer Mindmap werden.",
        },
      ],
    },
    pricing: {
      eyebrow: "",
      heading: "Schlauer und besser lernen",
      subhead:
        "Chatten ohne Grenzen. Podcasts erstellen, größere Dateien hochladen und vieles mehr.",
      footnote:
        "Jederzeit kündbar - die Abrechnung endet am Ende der Periode.",
      cta: "Plan wählen",
    },
    cta: {
      heading: "Lerne 2× schneller – mit Nomi, wie tausende Studierende",
      body: "Kostenlos starten. Keine Karte, keine Verpflichtung.",
      button: "Kostenlos mit dem Lernen beginnen",
    },
    footer: {
      tagline:
        "Der KI-Lern-Workspace für Menschen, die wirklich behalten müssen, was sie lesen.",
      cols: [
        // {
        //   title: "Produkt",
        //   items: [
        //     "AI Flashcards",
        //     "AI PDF Summarizer",
        //     "AI PPT Summarizer",
        //     "AI Video Summarizer",
        //     "AI Lecture Note Taker",
        //     "AI Article Summarizer",
        //     "AI Notes Summarizer",
        //     "AI Quiz Generator",
        //     "AI Mind Map Maker",
        //     "AI Tutor Chat",
        //     "AI Podcast Maker",
        //     "AI Study Guide",
        //   ],
        // },
        // {
        //   title: "Anwendungsfälle",
        //   items: [
        //     "MCAT & USMLE",
        //     "Jurastudium",
        //     "Ingenieurwesen",
        //     "Selbststudium",
        //     "Forschende",
        //     "Lehrkräfte",
        //   ],
        // },
        {
          title: "Ressourcen",
          items: ["Preise", "Blog", "Community"],
        },
        {
          title: "Unternehmen",
          items: ["Datenschutz", "AGB", "Kontakt"],
        },
      ],
      copyright: "Alle Rechte vorbehalten.",
      madeIn: "Für Lernende gebaut.",
    },
  },

  es: {
    nav: { features: "Funciones", pricing: "Precios", blog: "Blog", tryFree: "Prueba gratis" },
    hero: {
      title1: "La única herramienta de estudio con IA",
      title2: "que necesitas para aprender",
      titleItalic: "cualquier cosa.",
      subtitle:
        "Convierte tus materiales de estudio en apuntes, cuestionarios, flashcards, chats interactivos y mucho más.",
      seeFeatures: "Ver funciones",
      getStarted: "Empieza a estudiar gratis",
    },
    trust: { label: "Elegido por los mejores estudiantes de" },
    quizlet: {
      title: "La mejor alternativa a Quizlet con herramientas de estudio IA",
      body: "La alternativa #1 a Quizlet con herramientas de estudio IA. Elegir la herramienta perfecta puede ser difícil, ¡así que lo creamos todo en una sola app!",
      bullets: [
        "Sube cualquier documento y deja que nuestro resumidor de PDF lo convierta en apuntes, flashcards y cuestionarios",
        "Pega un enlace o elige un clip y nuestro resumidor de vídeos de YouTube extrae las ideas clave",
        "Pulsa grabar en clase y nuestro resumidor de clases con IA escribe los apuntes por ti",
      ],
    },
    features: {
      heading: "Todo lo que necesitas en un solo lugar.",
      items: [
        {
          title: "Generador de flashcards con IA",
          body: "Convierte cualquier material de estudio en flashcards con repetición espaciada pensadas para retener a largo plazo.",
        },
        {
          title: "Tutor IA",
          body: "Recibe explicaciones personalizadas y respuestas al instante de un tutor IA que entiende tu material de estudio.",
        },
        {
          title: "Generador de cuestionarios con IA",
          body: "Detecta tus lagunas de conocimiento y refuerza tu comprensión con cuestionarios generados por IA.",
        },
        {
          title: "Generador de podcasts con IA",
          body: "Transforma cualquier contenido en un podcast con IA y estudia sobre la marcha.",
        },
        {
          title: "Mapas mentales visuales desde cualquier fuente",
          body: "Desglosa temas complejos en ideas conectadas que de verdad entiendes.",
        },
        {
          title: "Apuntes de clase con IA",
          body: "Céntrate en la clase mientras la IA capta y organiza los puntos importantes por ti.",
        },
        {
          title: "Cambia entre perfiles de tutor según cómo aprendes",
          body: "Elige un tutor socrático, un coach de examen o un explicador cercano: cada perfil adapta su tono, profundidad y ritmo a tu forma de estudiar.",
        },
        {
          title: "Estudia en tu idioma nativo",
          body: "Estudia desde cualquier material en el idioma que prefieras, sin necesidad de traducción.",
        },
        {
          title: "Planificador de estudio con IA",
          body: "Genera un plan de estudio personalizado según tus exámenes y objetivos.",
        },
      ],
    },
    testimonials: [
      {
        role: "Aspirante al Gaokao",
        headline: "Mejores flashcards que las mías",
        quote:
          "A las 2 de la madrugada metí toda mi carpeta de química inorgánica y entré al examen sin sentirme frita. Las flashcards eran mejores que las que tardaba horas en hacer yo.",
      },
      {
        role: "Estudiante de informática, Universidad de Toronto",
        headline: "Adiós a las grabaciones de 2 horas",
        quote:
          "El resumen de clases es una locura. Dejé de ver de nuevo grabaciones de 2 horas porque saca exactamente lo que los profes esconden entre divagaciones.",
      },
      {
        role: "Estudiante",
        headline: "Mis apuntes por fin se hablan",
        quote:
          "Tenía apuntes repartidos entre Notion, PDFs sueltos, Telegram y Google Docs. Ahora lo tiro todo aquí y la IA de verdad se acuerda de mi material cuando le pregunto.",
      },
      {
        role: "Estudiante",
        headline: "Brutal, en el buen sentido",
        quote:
          "Los cuestionarios son brutales en el buen sentido. Sigue apuntando a los capítulos en los que la cago en vez de ponerme preguntas fáciles para subirme el ánimo.",
      },
      {
        role: "Estudiante de bachillerato, Shanghái",
        headline: "Me salvó la preparación del Gaokao",
        quote:
          "Grabé mi clase de refuerzo en el metro de vuelta a casa y antes de cenar tenía los apuntes de repaso. De verdad me salvó la preparación del Gaokao.",
      },
      {
        role: "Estudiante",
        headline: "Como ese amigo listo que sí explica",
        quote:
          "Se siente menos como una app y más como ese amigo listo que te explica las cosas sin que te sientas tonto. El tutor pilla al vuelo los huecos en mi razonamiento.",
      },
      {
        role: "Estudiante pre-med, UCLA",
        headline: "Ojalá lo hubiera encontrado antes",
        quote:
          "Lo usé una semana antes de los finales y me arrepentí al instante de no haberlo encontrado antes. La IA explicando cosas a partir de mis propios apuntes lo cambió todo.",
      },
      {
        role: "Estudiante de informática",
        headline: "El modo TDAH está infravalorado",
        quote:
          "El modo TDAH está infravalorado. Dividir capítulos largos en mini lecciones y cuestionarios hizo que estudiar fuera mucho menos agotador.",
      },
    ],
    faq: {
      heading: "Preguntas frecuentes",
      intro:
        "Todo lo que necesitas saber sobre nomi: la herramienta de estudio con IA que convierte cualquier fuente en flashcards, cuestionarios, apuntes y un tutor.",
      items: [
        {
          q: "¿Qué es nomi y cómo funciona como herramienta de estudio con IA?",
          a: "nomi es una plataforma de estudio con IA todo en uno que convierte tus PDFs, grabaciones de clase, vídeos de YouTube y apuntes en flashcards, cuestionarios, resúmenes, mapas mentales y un tutor que responde basándose en tu propio material.",
        },
        {
          q: "¿nomi es una alternativa gratuita a Quizlet?",
          a: "Sí. nomi ofrece un plan gratis con flashcards IA, cuestionarios y resúmenes de tu propio material, además de un tutor que sí entiende tu contenido, algo que Quizlet no hace.",
        },
        {
          q: "¿El generador de flashcards con IA crea tarjetas desde PDF y vídeos de YouTube?",
          a: "Sin duda. Sube un PDF, pega una URL de YouTube o añade tus apuntes y el generador de flashcards de nomi crea tarjetas con repetición espaciada en segundos.",
        },
        {
          q: "¿Cómo funciona el resumidor de clases con IA?",
          a: "Graba una clase dentro de nomi o sube un archivo de audio. El resumidor la transcribe, extrae los conceptos clave y genera apuntes concisos y un resumen para repasar.",
        },
        {
          q: "¿Puedo generar cuestionarios y exámenes de práctica automáticamente?",
          a: "Sí. nomi genera automáticamente cuestionarios tipo test, exámenes y preguntas de repaso desde cualquier fuente que subas, sin escribir una sola pregunta.",
        },
        {
          q: "¿El tutor IA entiende de verdad mi material?",
          a: "El tutor se basa en los documentos, vídeos y apuntes que subes, así que cita tu propio material al responder y adapta la profundidad a tu nivel en lugar de dar respuestas genéricas tipo ChatGPT.",
        },
        {
          q: "¿Mi material es privado y seguro en nomi?",
          a: "Tus archivos son privados y están vinculados a tu cuenta. No vendemos tus datos y tu contenido nunca se usa para entrenar modelos públicos.",
        },
        {
          q: "¿Qué tipos de archivo y fuentes admite nomi?",
          a: "nomi admite PDFs, documentos Word, diapositivas, apuntes de texto, audios, enlaces de YouTube y artículos web: cualquier cosa con la que estudies puede convertirse en flashcard, cuestionario, resumen o mapa mental.",
        },
      ],
    },
    pricing: {
      eyebrow: "",
      heading: "Estudia de forma más inteligente y mejor",
      subhead:
        "Chatea sin límites. Crea podcasts y sube archivos más grandes y mucho más.",
      footnote:
        "Cancela cuando quieras - la facturación termina al final del periodo.",
      cta: "Seleccionar plan",
    },
    cta: {
      heading: "Únete a los estudiantes que estudian 2× más rápido con Nomi",
      body: "Empieza gratis. Sin tarjeta, sin compromiso.",
      button: "Empieza a estudiar gratis",
    },
    footer: {
      tagline:
        "El espacio de estudio con IA para quien de verdad necesita recordar lo que lee.",
      cols: [
        // {
        //   title: "Producto",
        //   items: [
        //     "AI Flashcards",
        //     "AI PDF Summarizer",
        //     "AI PPT Summarizer",
        //     "AI Video Summarizer",
        //     "AI Lecture Note Taker",
        //     "AI Article Summarizer",
        //     "AI Notes Summarizer",
        //     "AI Quiz Generator",
        //     "AI Mind Map Maker",
        //     "AI Tutor Chat",
        //     "AI Podcast Maker",
        //     "AI Study Guide",
        //   ],
        // },
        // {
        //   title: "Casos de uso",
        //   items: [
        //     "MCAT y USMLE",
        //     "Derecho",
        //     "Ingeniería",
        //     "Autoestudio",
        //     "Investigadores",
        //     "Profesores",
        //   ],
        // },
        {
          title: "Recursos",
          items: ["Precios", "Blog", "Comunidad"],
        },
        {
          title: "Empresa",
          items: ["Privacidad", "Términos", "Contacto"],
        },
      ],
      copyright: "Todos los derechos reservados.",
      madeIn: "Hecho para quienes aprenden.",
    },
  },

  tr: {
    nav: { features: "Özellikler", pricing: "Fiyatlandırma", blog: "Blog", tryFree: "Ücretsiz dene" },
    hero: {
      title1: "Öğrenmek için ihtiyacın olan",
      title2: "tek AI çalışma aracı,",
      titleItalic: "her şeyi öğren.",
      subtitle:
        "Çalışma materyallerini notlara, testlere, kartlara, etkileşimli sohbetlere ve daha fazlasına dönüştür.",
      seeFeatures: "Özellikleri gör",
      getStarted: "Ücretsiz çalışmaya başla",
    },
    trust: { label: "En iyi öğrenciler tarafından tercih edilen" },
    quizlet: {
      title: "AI çalışma araçlarıyla en iyi Quizlet alternatifi",
      body: "AI çalışma araçlarıyla 1 numaralı Quizlet alternatifi. Doğru aracı seçmek zor olabilir, biz de her şeyi tek bir uygulamada birleştirdik!",
      bullets: [
        "Herhangi bir belgeyi yükle, PDF Özetleyicimiz onu notlara, kartlara ve testlere dönüştürsün",
        "Bir bağlantı yapıştır veya bir klip seç, YouTube Video Özetleyicimiz ana fikirleri çıkarsın",
        "Derste kaydı başlat, AI Ders Özetleyicimiz notları senin yerine yazsın",
      ],
    },
    features: {
      heading: "İhtiyacın olan her şey tek yerde.",
      items: [
        {
          title: "AI kart oluşturucu",
          body: "Herhangi bir çalışma materyalini uzun süreli hatırlama için tasarlanmış aralıklı tekrar kartlarına dönüştür.",
        },
        {
          title: "AI tutor",
          body: "Çalışma materyalini anlayan bir AI tutordan kişiselleştirilmiş açıklamalar ve anında cevaplar al.",
        },
        {
          title: "AI test oluşturucu",
          body: "Bilgi boşluklarını tespit et ve AI ile oluşturulan testlerle anlayışını güçlendir.",
        },
        {
          title: "AI podcast oluşturucu",
          body: "Herhangi bir içeriği AI podcast'ine dönüştür ve yolda çalış.",
        },
        {
          title: "Herhangi bir kaynaktan görsel zihin haritaları",
          body: "Karmaşık konuları gerçekten anlayabileceğin bağlantılı fikirlere böl.",
        },
        {
          title: "AI ders notu tutucu",
          body: "Derse odaklan, AI önemli noktaları senin için yakalasın ve düzenlesin.",
        },
        {
          title: "Öğrenme tarzına uyan tutor karakterleri arasında geçiş yap",
          body: "Sokratik bir tutor, sınav koçu veya samimi bir anlatıcı seç; her karakter tonunu, derinliğini ve hızını en iyi çalıştığın şekilde uyduracak.",
        },
        {
          title: "Ana dilinde çalış",
          body: "Herhangi bir materyali tercih ettiğin dilde çalış; çeviri gerekmez.",
        },
        {
          title: "AI çalışma planlayıcısı",
          body: "Sınavlarına ve hedeflerine göre kişiselleştirilmiş bir çalışma programı oluştur.",
        },
      ],
    },
    testimonials: [
      {
        role: "Gaokao adayı",
        headline: "Kendim yapacağımdan daha iyi kartlar",
        quote:
          "Gece 2'de tüm inorganik kimya klasörümü içine attım ve sınava çökmüş hissetmeden girdim. Kartlar saatlerce kendim yapacağımdan gerçekten daha iyiydi.",
      },
      {
        role: "Bilgisayar öğrencisi, Toronto Üniversitesi",
        headline: "Artık 2 saatlik kayıt yok",
        quote:
          "Ders özeti olayı resmen çılgınca. Hocaların rastgele tanjantlar arasında sakladığı kısımları tam çekip çıkardığı için 2 saatlik kayıtları bir daha izlemiyorum.",
      },
      {
        role: "Öğrenci",
        headline: "Notlarım sonunda birbiriyle konuşuyor",
        quote:
          "Notlarım Notion, rastgele PDF'ler, Telegram ve Google Docs arasında dağınıktı. Şimdi hepsini buraya atıyorum ve AI sorduğumda gerçekten benim materyalimi hatırlıyor.",
      },
      {
        role: "Öğrenci",
        headline: "İyi anlamda acımasız",
        quote:
          "Testler iyi anlamda acımasız. Bana kolay özgüven soruları sormak yerine sürekli hata yaptığım bölümleri hedefliyor.",
      },
      {
        role: "Lise son sınıfı, Şangay",
        headline: "Gaokao hazırlığımı kurtardı",
        quote:
          "Eve dönerken metroda dershane dersimi kaydettim, akşam yemeğinden önce tekrar notları hazırdı. Gaokao hazırlığımı gerçekten kurtardı.",
      },
      {
        role: "Öğrenci",
        headline: "Anlatan o akıllı arkadaş gibi",
        quote:
          "Bir uygulamadan çok, sana aptal hissettirmeden konuları açıklayan o akıllı arkadaş gibi geliyor. Tutor, akıl yürütmemdeki boşlukları anında yakalıyor.",
      },
      {
        role: "Pre-med öğrencisi, UCLA",
        headline: "Keşke daha önce bulsaydım",
        quote:
          "Finallerden bir hafta önce kullandım ve daha önce bulmadığıma anında pişman oldum. AI tutor'un kendi notlarımdan konuları açıklaması her şeyi değiştirdi.",
      },
      {
        role: "Bilgisayar öğrencisi",
        headline: "ADHD modu hak ettiği değeri görmüyor",
        quote:
          "ADHD modu hak ettiği değeri görmüyor. Uzun bölümleri minik dersler ve testlere bölmek çalışmayı çok daha az yorucu hale getirdi.",
      },
    ],
    faq: {
      heading: "Sıkça sorulan sorular",
      intro:
        "nomi hakkında bilmen gereken her şey – herhangi bir kaynağı kartlara, testlere, notlara ve bir tutora dönüştüren AI çalışma aracı.",
      items: [
        {
          q: "nomi nedir ve AI çalışma aracı olarak nasıl çalışır?",
          a: "nomi; PDF'lerini, ders kayıtlarını, YouTube videolarını ve notlarını kartlara, testlere, özetlere, zihin haritalarına ve senin materyaline dayanan bir tutora dönüştüren hepsi bir arada bir AI çalışma platformudur.",
        },
        {
          q: "nomi ücretsiz bir Quizlet alternatifi mi?",
          a: "Evet. nomi kendi materyalinden AI kartlar, testler ve özetler içeren ücretsiz bir plan sunar; ayrıca Quizlet'ten farklı olarak içeriğini gerçekten anlayan bir tutor da içerir.",
        },
        {
          q: "AI kart oluşturucu PDF ve YouTube videolarından kart oluşturabilir mi?",
          a: "Kesinlikle. Bir PDF yükle, YouTube URL'si yapıştır veya ders notlarını ekle; nomi'nın AI kart oluşturucusu saniyeler içinde aralıklı tekrar kartları üretir.",
        },
        {
          q: "AI ders özetleyici nasıl çalışır?",
          a: "Dersini doğrudan nomi'da kaydet ya da bir ses dosyası yükle. AI ders özetleyici dersi yazıya döker, ana kavramları çıkarır ve tekrar edebileceğin kısa notlar ile bir özet üretir.",
        },
        {
          q: "Testleri ve deneme sınavlarını otomatik oluşturabilir miyim?",
          a: "Evet. nomi yüklediğin herhangi bir kaynaktan çoktan seçmeli testleri, deneme sınavlarını ve tekrar sorularını otomatik üretir; tek bir soru bile yazmana gerek yok.",
        },
        {
          q: "AI tutor çalışma materyalimi gerçekten anlıyor mu?",
          a: "Tutor yüklediğin belgelere, videolara ve notlara dayanır; cevap verirken kendi materyalinden alıntı yapar ve genel ChatGPT tarzı cevaplar yerine seviyene göre derinliği ayarlar.",
        },
        {
          q: "Çalışma materyalim nomi'da gizli ve güvenli mi?",
          a: "Yüklediklerin hesabına özeldir. Verilerini satmıyoruz ve içeriğin hiçbir zaman herkese açık modelleri eğitmek için kullanılmaz.",
        },
        {
          q: "nomi hangi dosya türlerini ve kaynakları destekler?",
          a: "nomi PDF, Word belgesi, sunum, metin notu, ses kaydı, YouTube bağlantısı ve web makalesi destekler – çalıştığın her şey karta, teste, özete veya zihin haritasına dönüşebilir.",
        },
      ],
    },
    pricing: {
      eyebrow: "",
      heading: "Daha akıllı ve daha iyi çalış",
      subhead:
        "Sınırsız sohbet et. Podcast oluştur, daha büyük dosyalar yükle ve daha fazlası.",
      footnote:
        "İstediğin zaman iptal et - dönem sonunda faturalandırma durur.",
      cta: "Plan seç",
    },
    cta: {
      heading: "Nomi ile 2× daha hızlı çalışan öğrencilere katıl",
      body: "Ücretsiz başla. Kart yok, taahhüt yok.",
      button: "Ücretsiz çalışmaya başla",
    },
    footer: {
      tagline:
        "Okuduğunu gerçekten hatırlaması gerekenler için AI çalışma alanı.",
      cols: [
        // {
        //   title: "Ürün",
        //   items: [
        //     "AI Flashcards",
        //     "AI PDF Summarizer",
        //     "AI PPT Summarizer",
        //     "AI Video Summarizer",
        //     "AI Lecture Note Taker",
        //     "AI Article Summarizer",
        //     "AI Notes Summarizer",
        //     "AI Quiz Generator",
        //     "AI Mind Map Maker",
        //     "AI Tutor Chat",
        //     "AI Podcast Maker",
        //     "AI Study Guide",
        //   ],
        // },
        // {
        //   title: "Kullanım alanları",
        //   items: [
        //     "MCAT ve USMLE",
        //     "Hukuk",
        //     "Mühendislik",
        //     "Bireysel çalışma",
        //     "Araştırmacılar",
        //     "Öğretmenler",
        //   ],
        // },
        {
          title: "Kaynaklar",
          items: ["Fiyatlandırma", "Blog", "Topluluk"],
        },
        {
          title: "Şirket",
          items: ["Gizlilik", "Şartlar", "İletişim"],
        },
      ],
      copyright: "Tüm hakları saklıdır.",
      madeIn: "Öğrenenler için yapıldı.",
    },
  },
}
